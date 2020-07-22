import WasabeeOp from "./operation";
import WasabeeLink from "./link";
import WasabeeTeam from "./team";
import WasabeeMe from "./me";
import WasabeeMarker from "./marker";
import { notify } from "./notify";
// import Sortable, { MultiDrag, Swap} from 'sortablejs';
import Sortable from "sortablejs";
import "leaflet.geodesic";
import { logEvent } from "./firebase";
import {
  loadTeam,
  loadOp,
  addPermPromise,
  deletePermPromise,
  setAssignmentStatus,
} from "./server";

export function displayOp(state) {
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);

  const op = new WasabeeOp(localStorage[state.op]);
  if (!op) {
    notify("invalid op");
    return;
  }

  subnav.innerHTML = `
<nav class="navbar navbar-expand-sm navbar-light bg-light">
<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#opNav" aria-controls="opNav" aria-expanded="false" aria-label="Toggle Subnav">
<span class="navbar-toggler-icon"></span>
</button>
<div class="collapse navbar-collapse" id="opNav">
  <ul class="navbar-nav" id="opNavbar">
  </ul>
 </div>
</nav>
`;

  const opNavbar = document.getElementById("opNavbar");

  for (const [nav, action, name] of [
    ["checklist", checklist, "Checklist"],
    ["assignments", assignments, "Assignments"],
    ["map", map, "Map"],
    ["keys", keys, "Keys"],
  ]) {
    const li = L.DomUtil.create("li", "nav-item", opNavbar);
    const link = L.DomUtil.create("a", "nav-link", li);
    link.href = `#operation.${nav}.${state.op}`;
    link.textContent = name;
    link.id = "op" + nav;
    L.DomEvent.on(link, "click", (ev) => {
      L.DomEvent.stop(ev);
      for (const c of opNavbar.children)
        for (const a of c.children) L.DomUtil.removeClass(a, "active");
      L.DomUtil.addClass(link, "active");
      action(op);
    });
  }

  const me = WasabeeMe.get();

  let owner = me.GoogleID == op.creator;

  let write = false;
  for (const t of op.teamlist) if (t.role == "write") write = true;

  if (write || owner) {
    for (const [nav, action, name] of [
      ["manage", manage, "Manage"],
      ["permissions", permissions, "Permissions"],
    ]) {
      const li = L.DomUtil.create("li", "nav-item", opNavbar);
      const link = L.DomUtil.create("a", "nav-link", li);
      link.href = `#operation.${nav}.${state.op}`;
      link.textContent = name;
      link.id = "op" + nav;
      L.DomEvent.on(link, "click", (ev) => {
        L.DomEvent.stop(ev);
        for (const c of opNavbar.children)
          for (const a of c.children) L.DomUtil.removeClass(a, "active");
        L.DomUtil.addClass(link, "active");
        action(op);
      });
    }
  }

  const m = `<li class="nav-item"><a class="nav-link" id="opRefresh">↻</a></li>`;
  opNavbar.insertAdjacentHTML("beforeend", m);
  const opRefreshNav = document.getElementById("opRefresh");
  L.DomEvent.on(opRefreshNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    loadOp(state.op)
      .then((op) => {
        const promises = [];
        const teamset = new Set(op.teamlist.map((t) => t.teamid));
        for (const t of teamset) promises.push(loadTeam(t));
        return Promise.allSettled(promises);
      })
      .then(() => displayOp(history.state))
      .catch(() =>
        notify("Op load failed, please refresh from operations list")
      );
  });

  switch (state.subscreen) {
    case "map":
      L.DomUtil.addClass(document.getElementById("opmap"), "active");
      map(op);
      break;
    case "manage":
      L.DomUtil.addClass(document.getElementById("opmanage"), "active");
      manage(op);
      break;
    case "keys":
      L.DomUtil.addClass(document.getElementById("opkeys"), "active");
      keys(op);
      break;
    case "assignments":
      L.DomUtil.addClass(document.getElementById("opassignments"), "active");
      assignments(op);
      break;
    case "permissions":
      L.DomUtil.addClass(document.getElementById("oppermissions"), "active");
      permissions(op);
      break;
    case "checklist":
    default:
      L.DomUtil.addClass(document.getElementById("opchecklist"), "active");
      checklist(op);
  }
}

function assignments(op) {
  return checklist(op, true);
}

function checklist(op, assignmentsOnly = false) {
  const subscreen = assignmentsOnly ? "assignments" : "checklist";
  history.pushState(
    { screen: "operation", op: op.ID, subscreen: subscreen },
    "op ${subscreen}",
    `#op.${subscreen}.${op.ID}`
  );
  logEvent("screen_view", { screen_name: `op ${subscreen}` });

  const me = WasabeeMe.get();

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `

<div class="card mb-2">
<div class="card-header" id="opName">${op.name}</div>
<div class="card-body">
<ul class="list-group list-group-flush">
<li class="list-group-item" id="opComment">Comment: ${op.comment}</li>
<li class="list-group-item"><a href="/api/vi/draw/${op.ID}/stock">Stock Intel Link</a></li>
<li class="list-group-item"><strong><a href="/api/v1/draw/${op.ID}/myroute">My Route</a> (Google Maps)</strong></li>
</ul>
</div>
</div>
<table class="table table-striped" id="optable">
<thead>
<tr>
<th scope="col">Order</th>
<th scope="col">Portal</th>
<th scope="col">To/Action</th>
<th scope="col">Distance</th>
<th scope="col">Assigned To</th>
<th scope="col">Description</th>
<th scope="col">Completed</th>
</tr>
</thead>
<tbody id="opSteps"><!-- data goes here --></tbody>
</table>
</div>
</div>

<div id="opTable"></div>
</div></div></div>
`;

  const opSteps = document.getElementById("opSteps");
  const steps = op.markers.concat(op.links);
  steps.sort((a, b) => {
    return a.opOrder - b.opOrder;
  });
  for (const s of steps) {
    if (assignmentsOnly && s.assignedTo != me.GoogleID) continue;

    const row = L.DomUtil.create("tr", null, opSteps);
    L.DomUtil.create("td", null, row).textContent = s.opOrder;

    if (s instanceof WasabeeMarker) {
      const portal = L.DomUtil.create("td", null, row);
      const p = op.getPortal(s.portalId);
      portal.textContent = p.name;

      L.DomUtil.create("td", s.type, row).textContent = " " + s.type;
      L.DomUtil.create("td", null, row).textContent = " ";
      const assignedToTD = L.DomUtil.create("td", null, row);
      assignedToTD.textContent = s.assignedTo;
      if (s.assignedTo) {
        const agent = op.getAgent(s.assignedTo);
        if (agent) assignedToTD.textContent = agent.name;
      }
      L.DomUtil.create("td", null, row).textContent = s.comment;
    }
    if (s instanceof WasabeeLink) {
      const fPortal = L.DomUtil.create("td", null, row);
      const fp = op.getPortal(s.fromPortalId);
      fPortal.textContent = fp.name;
      const tPortal = L.DomUtil.create("td", null, row);
      const tp = op.getPortal(s.toPortalId);
      tPortal.textContent = tp.name;

      L.DomUtil.create("td", null, row).textContent = calculateDistance(fp, tp);
      const assignedToTD = L.DomUtil.create("td", null, row);
      assignedToTD.textContent = s.assignedTo;
      if (s.assignedTo) {
        const agent = op.getAgent(s.assignedTo);
        if (agent) assignedToTD.textContent = agent.name;
      }
      L.DomUtil.create("td", null, row).textContent = s.comment;
    }

    // on this screen, agents can only adjust the state of tasks assigned to them
    const completedCell = L.DomUtil.create("td", null, row);
    const completedCheck = L.DomUtil.create("input", null, completedCell);
    completedCheck.type = "checkbox";
    if (s.assignedTo == me.GoogleID) {
      completedCheck.disabled = false;
      L.DomEvent.on(completedCheck, "change", (ev) => {
        L.DomEvent.stop(ev);
        setAssignmentStatus(op, s, completedCheck.checked).then(
          () => {
            s.completed = completedCheck.checked;
            op.update();
          },
          (reject) => {
            notify(reject);
            console.log(reject);
          }
        );
      });
    } else {
      completedCheck.disabled = true;
    }
    if (s instanceof WasabeeLink) {
      completedCheck.checked = s.completed;
    } else {
      let c = false;
      if (s.completedBy) c = true;
      completedCheck.checked = c;
    }
  }
}

function map(op) {
  history.pushState(
    { screen: "operation", op: op.ID, subscreen: "map" },
    "op map",
    `#op.map.${op.ID}`
  );
  logEvent("screen_view", { screen_name: "op setting" });

  const me = WasabeeMe.get();

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);
  const height = Math.max(window.innerHeight - 300, 200);

  content.innerHTML = `
<div class="container-fluid"><div class="row"><div class="col">
<h1>${op.name}</h1>
<div id="map" style="height: ${height}"></div>
</div></div></div>
`;

  const map = L.map("map");
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.fitBounds(op.mbr);

  const defaultLayer = L.layerGroup().addTo(map);
  const assignmentsLayer = L.layerGroup().addTo(map);

  L.control
    .layers(
      {},
      {
        Default: defaultLayer,
        Assignments: assignmentsLayer,
      },
      { collapsed: false }
    )
    .addTo(map);

  const assignedAnchors = new Set();

  for (const m of op.markers) {
    const targetPortal = op.getPortal(m.portalId);
    const marker = L.marker(targetPortal.latLng, {
      title: targetPortal.name,
      state: m.state,
      icon: L.icon({
        iconUrl: m.icon,
        shadowUrl: null,
        iconSize: L.point(24, 40),
        iconAnchor: L.point(12, 40),
        popupAnchor: L.point(-1, -48),
      }),
    });

    const popup = L.DomUtil.create("div");
    const name = L.DomUtil.create("div", "portalname", popup);
    name.textContent = targetPortal.name;
    if (m.comment) {
      const comment = L.DomUtil.create("div", null, popup);
      comment.textContent = m.comment;
    }
    if (m.status != "pending") {
      const stat = L.DomUtil.create("div", null, popup);
      stat.textContent = m.status;
    }
    if (m.assignedTo) {
      const at = L.DomUtil.create("div", null, popup);
      at.textContent = m.assignedTo;
      const agent = op.getAgent(m.assignedTo);
      if (agent) at.textContent = agent.name;
    }

    const route = L.DomUtil.create("button", null, popup);
    route.textContent = "Google Map";
    L.DomEvent.on(route, "click", (ev) => {
      L.DomEvent.stop(ev);
      marker.closePopup();
      window.open(
        "https://www.google.com/maps/search/?api=1&query=" +
          targetPortal.lat +
          "," +
          targetPortal.lng
      );
    });

    marker.bindPopup(popup);
    if (m.assignedTo == me.GoogleID) marker.addTo(assignmentsLayer);
    else marker.addTo(defaultLayer);
  }

  for (const l of op.links) {
    const latLngs = [
      op.getPortal(l.fromPortalId).latLng,
      op.getPortal(l.toPortalId).latLng,
    ];

    const newlink = new L.Geodesic(latLngs, {
      weight: 3,
      opacity: 0.75,
      color: "green",
    });
    // console.log(newlink);

    if (l.assignedTo == me.GoogleID) {
      newlink.addTo(assignmentsLayer);
      assignedAnchors.add(l.fromPortalId);
      assignedAnchors.add(l.toPortalId);
    } else newlink.addTo(defaultLayer);
  }
  for (const a of op.anchors) {
    const targetPortal = op.getPortal(a);
    const marker = L.marker(targetPortal.latLng, {
      title: targetPortal.name,
      icon: L.icon({
        iconUrl: `${window.wasabeewebui.cdnurl}/img/markers/marker_layer_groupa.png`,
        shadowUrl: null,
        iconSize: L.point(24, 40),
        iconAnchor: L.point(12, 40),
        popupAnchor: L.point(-1, -48),
      }),
    });

    const popup = L.DomUtil.create("div");
    const name = L.DomUtil.create("div", "portalname", popup);
    name.textContent = targetPortal.name;

    if (a.comment) {
      const comment = L.DomUtil.create("div", null, popup);
      comment.textContent = a.comment;
    }

    const route = L.DomUtil.create("button", null, popup);
    route.textContent = "Google Map";
    L.DomEvent.on(route, "click", (ev) => {
      L.DomEvent.stop(ev);
      marker.closePopup();
      window.open(
        "https://www.google.com/maps/search/?api=1&query=" +
          targetPortal.lat +
          "," +
          targetPortal.lng
      );
    });

    marker.bindPopup(popup);
    if (assignedAnchors.has(a)) marker.addTo(assignmentsLayer);
    else marker.addTo(defaultLayer);
  }
}

function permissions(op) {
  history.pushState(
    { screen: "operation", op: op.ID, subscreen: "permissions" },
    "op permissions",
    `#op.permissions.${op.ID}`
  );
  logEvent("screen_view", { screen_name: "op permissions" });

  const me = WasabeeMe.get();

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1 id="opName">${op.name}</h1>
<table class="table table-striped">
<thead>
<tr>
<th scope="col">Team</th>
<th scope="col">Permission</th>
<th scope="col">&nbsp;</th>
</tr>
</thead>
<tbody id="opTable">
</tbody>
</table>
<label>Add Team:
  <select id="addTeamSelect"></select><select id="addRoleSelect"></select>
</label>
<button id="addButton">Add</button>
</div></div></div>
`;

  const opTable = document.getElementById("opTable");

  for (const t of op.teamlist) {
    const team = WasabeeTeam.get(t.teamid);
    const name = team ? team.name : t.teamid;
    const role = t.role;

    const row = L.DomUtil.create("tr", null, opTable);
    L.DomUtil.create("td", null, row).textContent = name;
    L.DomUtil.create("td", null, row).textContent = role;

    const tdRm = L.DomUtil.create("td", null, row);
    const removeButton = L.DomUtil.create("button", null, tdRm);
    removeButton.textContent = "Remove";
    L.DomEvent.on(removeButton, "click", (ev) => {
      L.DomEvent.stop(ev);
      deletePermPromise(op.ID, t.teamid, t.role)
        .then(() => loadOp(op.ID))
        .then((op) => manage(op));
    });
  }

  const addTeamSelect = document.getElementById("addTeamSelect");
  for (const t of me.Teams) {
    if (t.State != "On") continue;
    const o = L.DomUtil.create("option", null, addTeamSelect);
    o.value = t.ID;
    o.textContent = t.Name;
  }
  const addRoleSelect = document.getElementById("addRoleSelect");
  for (const role of ["read", "write", "assignedonly"]) {
    const read = L.DomUtil.create("option", null, addRoleSelect);
    read.value = role;
    read.textContent = role;
  }

  if (me.Teams.length > 0) {
    const addButton = document.getElementById("addButton");
    L.DomEvent.on(addButton, "click", (ev) => {
      L.DomEvent.stop(ev);
      const teamID = addTeamSelect.value;
      const role = addRoleSelect.value;

      // avoid duplicate
      for (const t of op.teamlist) {
        if (t.teamid == teamID && t.role == role) {
          loadOp(op.ID).then((op) => manage(op));
          return;
        }
      }
      addPermPromise(op.ID, teamID, role)
        .then(() => loadOp(op.ID))
        .then((op) => manage(op));
    });
  }
}

function keys(op) {
  history.pushState(
    { screen: "operation", op: op.ID, subscreen: "keys" },
    "op keys",
    `#op.keys.${op.ID}`
  );
  logEvent("screen_view", { screen_name: "op keys" });

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1 id="opName"></h1>
<table class="table table-striped">
<thead>
<tr>
<th scope="col">&nbsp;</th>
</tr>
</thead>
<tbody id="opTable">
</tbody>
</table>
</div></div></div>
`;

  const opName = document.getElementById("opName");
  opName.textContent = op.name;
  // const opTable = document.getElementById("opTable");
}

function manage(op) {
  history.pushState(
    { screen: "operation", op: op.ID, subscreen: "manage" },
    "op manage",
    `#op.manage.${op.ID}`
  );
  logEvent("screen_view", { screen_name: "op manage" });

  // const me = WasabeeMe.get();

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `

<div class="card mb-2">
<div class="card-header" id="opName">${op.name}</div>
<div class="card-body">
<ul class="list-group list-group-flush">
<li class="list-group-item" id="opComment"><textarea id="opComment">${op.comment}</textarea></li>
</ul>
</div>
</div>
<table class="table table-striped" id="optable">
<thead>
<tr>
<th scope="col">Order</th>
<th scope="col">Portal</th>
<th scope="col">To/Action</th>
<th scope="col">Distance</th>
<th scope="col">Assigned To</th>
<th scope="col">Description</th>
<th scope="col">Status</th>
<th scope="col">Completed</th>
</tr>
</thead>
<tbody id="opSteps"><!-- data goes here --></tbody>
</table>
</div>
</div>

<div id="opTable"></div>
</div></div></div>
`;

  const opSteps = document.getElementById("opSteps");
  const opComment = document.getElementById("opComment");
  L.DomEvent.on(opComment, "change", () => {
    console.log("changing op comment");
    // XXX push change to server
    op.comment = opComment.value;
    op.Save();
  });

  const steps = op.markers.concat(op.links);
  steps.sort((a, b) => {
    return a.opOrder - b.opOrder;
  });
  for (const s of steps) {
    const row = L.DomUtil.create("tr", null, opSteps);
    row.id = s.ID;
    row.setAttribute("data-id", s.ID);
    const opstep = L.DomUtil.create("td", null, row);
    opstep.textContent = s.opOrder;
    opstep.id = "opsteps-" + s.ID;

    if (s instanceof WasabeeMarker) {
      const portal = L.DomUtil.create("td", null, row);

      const p = op.getPortal(s.portalId);
      portal.textContent = p.name;

      L.DomUtil.create("td", s.type, row).textContent = " " + s.type;
      L.DomUtil.create("td", null, row).textContent = " ";
      const assignedToTD = L.DomUtil.create("td", null, row);
      assignedToTD.textContent = s.assignedTo;
      if (s.assignedTo) {
        const agent = op.getAgent(s.assignedTo);
        if (agent) assignedToTD.textContent = agent.name;
      }
      L.DomUtil.create("td", null, row).textContent = s.comment;
      L.DomUtil.create("td", null, row).textContent = s.state;
    }
    if (s instanceof WasabeeLink) {
      const fPortal = L.DomUtil.create("td", null, row);

      const fp = op.getPortal(s.fromPortalId);
      fPortal.textContent = fp.name;
      const tPortal = L.DomUtil.create("td", null, row);
      const tp = op.getPortal(s.toPortalId);
      tPortal.textContent = tp.name;

      L.DomUtil.create("td", null, row).textContent = calculateDistance(fp, tp);
      const assignedToTD = L.DomUtil.create("td", null, row);
      assignedToTD.textContent = s.assignedTo;
      if (s.assignedTo) {
        const agent = op.getAgent(s.assignedTo);
        if (agent) assignedToTD.textContent = agent.name;
      }
      L.DomUtil.create("td", null, row).textContent = s.comment;
      L.DomUtil.create("td", null, row).textContent = s.state;
    }
    const completedCell = L.DomUtil.create("td", null, row);
    const completedCheck = L.DomUtil.create("input", null, completedCell);
    completedCheck.type = "checkbox";
    completedCheck.disabled = false;
    L.DomEvent.on(completedCheck, "change", (ev) => {
      L.DomEvent.stop(ev);
      setAssignmentStatus(op, s, completedCheck.checked).then(
        () => {
          s.completed = completedCheck.checked;
          op.update();
        },
        (reject) => {
          notify(reject);
          console.log(reject);
        }
      );
    });

    // XXX we need to make a WasabeeLink.completed getter for both IITC and WebUI
    if (s instanceof WasabeeLink) {
      completedCheck.checked = s.completed;
    } else {
      let c = false;
      if (s.completedBy) c = true;
      completedCheck.checked = c;
    }
  }

  Sortable.create(opSteps, {
    multiDrag: true,
    selectedClass: "selected",
    animation: 150,
    store: {
      set: (o) => {
        const order = o.toArray();
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `${window.wasabeewebui.server}/api/v1/draw/${op.ID}/order`
        );
        xhr.setRequestHeader(
          "Content-Type",
          "application/x-www-form-urlencoded"
        );
        xhr.onload = function () {
          if (xhr.status === 200) {
            let i = 1;
            for (const obj of order) {
              const el = document.getElementById("opsteps-" + obj);
              if (el) {
                el.textContent = i;
                i++;
              } else {
                console.log("unable to get opsteps-" + obj);
              }
            }
          } else {
            console.log(xhr.responseText);
            notify(xhr.responseText);
          }
        };
        xhr.send(encodeURI("order=" + order));
      },
    },
  });
}

function calculateDistance(from, to) {
  const sl = parseFloat(from.lat);
  const el = parseFloat(to.lat);
  const startrl = (Math.PI * sl) / 180.0;
  const endrl = (Math.PI * el) / 180.0;
  const t = parseFloat(from.lng);
  const th = parseFloat(to.lng);
  const rt = (Math.PI * (t - th)) / 180.0;

  let dist =
    Math.sin(startrl) * Math.sin(endrl) +
    Math.cos(startrl) * Math.cos(endrl) * Math.cos(rt);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515 * 1.609344;
  dist = Math.round(dist * 100) / 100;

  let level = 1.0;
  if (dist > 0.016) {
    level = fourthroot(dist * 1000) / (2 * fourthroot(10));
  }
  if (level > 8) {
    level = 8;
  }
  level = Math.round(level * 10) / 10;

  return dist + "km (level " + level + ")";
}

function fourthroot(a) {
  return Math.pow(Math.E, Math.log(a) / 4.0);
}
