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
import { loadTeam, loadOp } from "./server";

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
<button class="navbar-toggler" type="button" data-toggle="collapse" data-garget="#opNav" aria-controls="opNav" aria-expanded="false" aria-label="Toggle Subnav">
<span class="navbar-toggler-icon"></span>
</button>
<div class="collapse navbar-collapse" id="opNav">
  <ul class="navbar-nav" id="opNavbar">
   <li class="nav-item"><a class="nav-link" href="#operation.checklist.${state.op}" id="opChecklist">Checklist</a></li>
   <li class="nav-item"><a class="nav-link" href="#operation.map.${state.op}" id="opMap">Map</a></li>
   <li class="nav-item"><a class="nav-link" href="#operation.keys.${state.op}" id="opKeys">Keys</a></li>
  </ul>
 </div>
</nav>
`;

  const opNavbar = document.getElementById("opNavbar");
  const opListNav = document.getElementById("opChecklist");
  const opMapNav = document.getElementById("opMap");
  const opKeysNav = document.getElementById("opKeys");
  L.DomEvent.on(opListNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const c of opNavbar.children)
      for (const a of c.children) L.DomUtil.removeClass(a, "active");
    L.DomUtil.addClass(opListNav, "active");
    checklist(op);
  });
  L.DomEvent.on(opMapNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const c of opNavbar.children)
      for (const a of c.children) L.DomUtil.removeClass(a, "active");
    L.DomUtil.addClass(opMapNav, "active");
    map(op);
  });
  L.DomEvent.on(opKeysNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const c of opNavbar.children)
      for (const a of c.children) L.DomUtil.removeClass(a, "active");
    L.DomUtil.addClass(opKeysNav, "active");
    keys(op);
  });

  const me = WasabeeMe.get();

  let owner = me.GoogleID == op.creator;

  let write = false;
  for (const t of op.teamlist) if (t.role == "write") write = true;

  if (write || owner) {
    const m = `<li class="nav-item"><a class="nav-link" href="#operation.manage.${state.op}" id="opManage">Manage</a></li>`;
    opNavbar.insertAdjacentHTML("beforeend", m);
    const opManageNav = document.getElementById("opManage");
    L.DomEvent.on(opManageNav, "click", (ev) => {
      L.DomEvent.stop(ev);
      for (const c of opNavbar.children)
        for (const a of c.children) L.DomUtil.removeClass(a, "active");
      L.DomUtil.addClass(opManageNav, "active");
      manage(op);
    });
  }

  const m = `<li class="nav-item"><a class="nav-link" id="opRefresh">🗘</a></li>`;
  opNavbar.insertAdjacentHTML("beforeend", m);
  const opRefreshNav = document.getElementById("opRefresh");
  L.DomEvent.on(opRefreshNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    const promises = [loadOp(state.op)];
    const teamset = new Set(op.teamlist.map((t) => t.teamid));
    for (const t of teamset) promises.push(loadTeam(t));
    Promise.allSettled(promises).then(() => displayOp(history.state));
  });

  switch (state.subscreen) {
    case "map":
      L.DomUtil.addClass(opMapNav, "active");
      map(op);
      break;
    case "manage":
      L.DomUtil.addClass(document.getElementById("opManage"), "active");
      manage(op);
      break;
    case "keys":
      L.DomUtil.addClass(opKeysNav, "active");
      keys(op);
      break;
    case "checklist":
    default:
      L.DomUtil.addClass(opListNav, "active");
      checklist(op);
  }
}

function checklist(op) {
  history.pushState(
    { screen: "op", op: op.ID, subscreen: "checklist" },
    "op checklist",
    `#op.checklist.${op.ID}`
  );
  logEvent("screen_view", { screen_name: "op checklist" });

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

  // const opTable = document.getElementById("opTable");
  const opSteps = document.getElementById("opSteps");
  const steps = op.markers.concat(op.links);
  steps.sort((a, b) => {
    return a.opOrder - b.opOrder;
  });
  for (const s of steps) {
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
      if (s.assignedTo != null && s.assignedTo != "") {
        for (const teamEntry of op.teamlist) {
          const team = WasabeeTeam.get(teamEntry.teamid);
          if (team) {
            const agent = team.getAgent(s.assignedTo);
            if (agent) {
              assignedToTD.textContent = agent.name;
              break;
            }
          }
        }
      }
      L.DomUtil.create("td", null, row).textContent = s.comment;
      L.DomUtil.create("td", null, row).textContent = s.state;
      L.DomUtil.create("td", null, row).textContent = s.completedBy;
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
      if (s.assignedTo != null && s.assignedTo != "") {
        for (const teamEntry of op.teamlist) {
          const team = WasabeeTeam.get(teamEntry.teamid);
          if (team) {
            const agent = team.getAgent(s.assignedTo);
            if (agent) {
              assignedToTD.textContent = agent.name;
              break;
            }
          }
        }
      }
      L.DomUtil.create("td", null, row).textContent = s.comment;
      L.DomUtil.create("td", null, row).textContent = s.state;
      L.DomUtil.create("td", null, row).textContent = s.completed;
    }
  }
  // disable this once the manage screen is done
  Sortable.create(opSteps);
}

function map(op) {
  history.pushState(
    { screen: "op", op: op.ID, subscreen: "map" },
    "op map",
    `#op.map.${op.ID}`
  );
  logEvent("screen_view", { screen_name: "op setting" });

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

  for (const m of op.markers) {
    const targetPortal = op.getPortal(m.portalId);
    const marker = L.marker(targetPortal.latLng, {
      title: targetPortal.name,
      state: m.state,
      // icon: L.icon({ iconUrl: m.icon, shadowUrl: null, iconSize: L.point(24, 40), iconAnchor: L.point(12, 40), popupAnchor: L.point(-1, -48), }),
    });
    marker.addTo(map);
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
    newlink.addTo(map);
  }
  for (const a of op.anchors) {
    const targetPortal = op.getPortal(a);
    const marker = L.marker(targetPortal.latLng, {
      title: targetPortal.name,
      // icon: L.icon({ iconUrl: m.icon, shadowUrl: null, iconSize: L.point(24, 40), iconAnchor: L.point(12, 40), popupAnchor: L.point(-1, -48), }),
    });
    marker.addTo(map);
  }
}

function manage(op) {
  history.pushState(
    { screen: "op", op: op.ID, subscreen: "manage" },
    "op manage",
    `#op.manage.${op.ID}`
  );
  logEvent("screen_view", { screen_name: "op manage" });

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1 id="opName"></h1>
<table class="table table-striped">
<thead>
<tr>
<th scope="col">&nbsp;</th>
<th scope="col">Agent</th>
<th scope="col">Enabled</th>
<th scope="col">Squad</th>
<th scope="col">Display Name</th>
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

function keys(op) {
  history.pushState(
    { screen: "op", op: op.ID, subscreen: "keys" },
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
<th scope="col">Agent</th>
<th scope="col">Enabled</th>
<th scope="col">Squad</th>
<th scope="col">Display Name</th>
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

export function calculateDistance(from, to) {
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
