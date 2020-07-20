import {
  loadTeam,
  removeAgentFromTeam,
  setSquad,
  setDisplayName,
  changeTeamOwnerPromise,
  createJoinLinkPromise,
  deleteJoinLinkPromise,
} from "./server";
import { notify } from "./notify";
import WasabeeMe from "./me";
import { logEvent } from "./firebase";

export function displayTeam(state) {
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);

  subnav.innerHTML = `
<nav class="navbar navbar-expand-sm navbar-light bg-light">
<button class="navbar-toggler" type="button" data-toggle="collapse" data-garget="#teamsNav" aria-controls="teamsNav" aria-expanded="false" aria-label="Toggle Subnav">
<span class="navbar-toggler-icon"></span>
</button>
<div class="collapse navbar-collapse" id="teamsNav">
  <ul class="navbar-nav" id="teamNavbar">
   <li class="nav-item"><a class="nav-link active" href="#team.list.${state.team}" id="teamList">List</a></li>
   <li class="nav-item"><a class="nav-link" href="#team.map.${state.team}" id="teamMap">Agent Map</a></li>
  </ul>
 </div>
</nav>
`;

  const teamNavbar = document.getElementById("teamNavbar");
  const teamListNav = document.getElementById("teamList");
  const teamMapNav = document.getElementById("teamMap");
  L.DomEvent.on(teamListNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const c of teamNavbar.children)
      for (const a of c.children) L.DomUtil.removeClass(a, "active");
    L.DomUtil.addClass(teamListNav, "active");
    list(state.team);
  });
  L.DomEvent.on(teamMapNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const c of teamNavbar.children)
      for (const a of c.children) L.DomUtil.removeClass(a, "active");
    L.DomUtil.addClass(teamMapNav, "active");
    map(state.team);
  });

  let owned = false;
  const me = WasabeeMe.get();
  for (const t of me.OwnedTeams) {
    if (t.ID == state.team) {
      owned = true;
      break;
    }
  }
  if (owned) {
    const m = `<li class="nav-item"><a class="nav-link" href="#team.manage.${state.team}" id="teamManage">Manage</a></li>`;
    teamNavbar.insertAdjacentHTML("beforeend", m);
    const teamManageNav = document.getElementById("teamManage");
    L.DomEvent.on(teamManageNav, "click", (ev) => {
      L.DomEvent.stop(ev);
      for (const c of teamNavbar.children)
        for (const a of c.children) L.DomUtil.removeClass(a, "active");
      L.DomUtil.addClass(teamManageNav, "active");
      manage(state.team);
    });

    const s = `<li class="nav-item"><a class="nav-link" href="#team.settings.${state.team}" id="teamSettings">Settings</a></li>`;
    teamNavbar.insertAdjacentHTML("beforeend", s);
    const teamSettingsNav = document.getElementById("teamSettings");
    L.DomEvent.on(teamSettingsNav, "click", (ev) => {
      L.DomEvent.stop(ev);
      for (const c of teamNavbar.children)
        for (const a of c.children) L.DomUtil.removeClass(a, "active");
      L.DomUtil.addClass(teamSettingsNav, "active");
      settings(state.team);
    });
  }

  switch (state.subscreen) {
    case "list":
      list(state.team);
      break;
    case "map":
      map(state.team);
      break;
    case "settings":
      settings(state.team);
      break;
    case "manage":
      manage(state.team);
      break;
    default:
      console.log("unknown team screen state:", state);
      list(state.team);
  }
}

function list(teamID) {
  history.pushState(
    { screen: "team", team: teamID, subscreen: "list" },
    "team list",
    `#team.list.${teamID}`
  );
  logEvent("screen_view", { screen_name: "team list" });

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1 id="teamName"></h1>
<table class="table table-striped">
<thead>
<tr>
<th scope="col">&nbsp;</th>
<th scope="col">Agent</th>
<th scope="col">Enabled</th>
<th scope="col">Squad</th>
</tr>
</thead>
<tbody id="teamTable">
</tbody>
</table>
</div></div></div>
`;

  const teamName = document.getElementById("teamName");
  const teamTable = document.getElementById("teamTable");

  loadTeam(teamID).then(
    (json) => {
      let team = null;
      try {
        team = JSON.parse(json);
      } catch (e) {
        console.log(e);
        notify(e);
        return;
      }
      teamName.textContent = team.name;
      for (const a of team.agents) {
        let state = "";
        if (a.state)
          state = `<img src="${window.wasabeewebui.cdnurl}/img/checkmark.png" alt="has team enabled">`;
        const row = `
<tr>
<td><img src="${a.pic}" height="50" width="50"></td>
<td>${a.name}</td>
<td>${state}</td>
<td>${a.squad}</td>
</tr>`;
        teamTable.insertAdjacentHTML("beforeend", row);
      }
    },
    (reject) => {
      console.log(reject);
      notify(reject);
    }
  );
}

function map(teamID) {
  history.pushState(
    { screen: "team", team: teamID, subscreen: "map" },
    "team map",
    `#team.map.${teamID}`
  );
  logEvent("screen_view", { screen_name: "team map" });

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);
  const height = Math.max(window.innerHeight - 300, 200);

  content.innerHTML = `
<div class="container-fluid"><div class="row"><div class="col">
<h1 id="teamName"></h1>
<div id="map" style="height: ${height}"></div>
</div></div></div>
`;

  const map = L.map("map");
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const teamName = document.getElementById("teamName");
  // const mapDiv = document.getElementById("map");

  loadTeam(teamID).then(
    (json) => {
      const lls = new Array();
      let team = null;
      try {
        team = JSON.parse(json);
      } catch (e) {
        console.log(e);
        notify(e);
        return;
      }
      teamName.textContent = team.name;
      for (const a of team.agents) {
        if (a.lat) {
          const m = L.marker([a.lat, a.lng], {
            title: a.name,
            icon: L.icon({
              iconUrl: a.pic,
              shadowUrl: null,
              iconSize: L.point(41, 41),
              iconAnchor: L.point(25, 41),
              popupAnchor: L.point(-1, -48),
            }),
            id: a.id,
          });

          m.bindPopup(a.name);
          m.addTo(map);
          lls.push([a.lat, a.lng]);
        }
      }
      // zoom to agents
      if (lls.length == 0) map.fitWorld();
      if (lls.length == 1) map.setView(lls[0], 13);
      if (lls.length > 1) {
        const bounds = L.latLngBounds(lls);
        map.fitBounds(bounds);
      }
    },
    (reject) => {
      notify(reject);
      console.log(reject);
    }
  );
}

function manage(teamID) {
  history.pushState(
    { screen: "team", team: teamID, subscreen: "manage" },
    "team manage",
    `#team.manage.${teamID}`
  );
  logEvent("screen_view", { screen_name: "team manage" });

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1 id="teamName"></h1>
<div>Form for adding agents will go here</div>
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
<tbody id="teamTable">
</tbody>
</table>
</div></div></div>
`;

  const teamName = document.getElementById("teamName");
  const teamTable = document.getElementById("teamTable");

  /*
<li class="list-group-item">
<form action="{{WebAPIPath}}/team/{{.ID}}" method="get">
<input type="text" name="key" />
<input type="submit" name="add" value="Add agent to team" />
<small>You can use an Agent name, a GoogleID, or an EnlID</small>
</form>
</li>
</ul>
 */

  loadTeam(teamID).then(
    (json) => {
      let team = null;
      try {
        team = JSON.parse(json);
      } catch (e) {
        console.log(e);
        notify(e);
        return;
      }
      teamName.textContent = team.name;
      for (const a of team.agents) {
        let state = "";
        if (a.state)
          state = `<img src="${window.wasabeewebui.cdnurl}/img/checkmark.png" alt="has team enabled">`;
        let remove = "";
        if (!team.RockCommunity) {
          remove = `<button id="${teamID}.${a.id}.remove">Remove</button>`;
        }
        let displayname = "";
        if (a.displayname) {
          displayname = a.displayname;
        }
        const row = `
<tr>
<td><img src="${a.pic}" height="50" width="50"></td>
<td>${a.name}</td>
<td>${state}</td>
<td><input type="text" value="${a.squad}" id="${teamID}.${a.id}.squad" /></td>
<td><input type="text" value="${displayname}" id="${teamID}.${a.id}.displayname" /></td>
<td>${remove}</td>
</tr>`;
        teamTable.insertAdjacentHTML("beforeend", row);
      }
      for (const a of team.agents) {
        const remove = document.getElementById(`${teamID}.${a.id}.remove`);
        L.DomEvent.on(remove, "click", (ev) => {
          L.DomEvent.stop(ev);
          removeAgentFromTeam(teamID, a.id).then(
            () => {
              manage(teamID);
            },
            (reject) => {
              notify(reject);
              console.log(reject);
            }
          );
        });

        const squad = document.getElementById(`${teamID}.${a.id}.squad`);
        L.DomEvent.on(squad, "change", (ev) => {
          L.DomEvent.stop(ev);
          setSquad(teamID, a.id, squad.value).then(
            () => {
              manage(teamID);
            },
            (reject) => {
              notify(reject);
              console.log(reject);
            }
          );
        });

        const displayname = document.getElementById(
          `${teamID}.${a.id}.displayname`
        );
        L.DomEvent.on(displayname, "change", (ev) => {
          L.DomEvent.stop(ev);
          setDisplayName(teamID, a.id, displayname.value).then(
            () => {
              manage(teamID);
            },
            (reject) => {
              notify(reject);
              console.log(reject);
            }
          );
        });
      }
    },
    (reject) => {
      notify(reject);
      console.log(reject);
    }
  );
}

function settings(teamID) {
  history.pushState(
    { screen: "team", team: teamID, subscreen: "setting" },
    "team settings",
    `#team.settings.${teamID}`
  );
  logEvent("screen_view", { screen_name: "team settings" });

  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1 id="teamName"></h1>
 <div class="card mb-2">
  <div class="card-header">Join Link</div>
   <div class="card-body" id="joinLink"></div>
  </div>
 <div class="card mb-2">
  <div class="card-header">enlightened.rocks Integration</div>
   <div class="card-body">
<!-- <form action="{{WebAPIPath}}/team/{{.ID}}/rockscfg" method="get"> -->
     <div>Rocks Community Identifier: <input type="text" name="rockscomm" id="rockscomm" /></div>
     <div>Rocks Community API Key: <input type="text" name="rockskey" id="rockskey" /></div>
     <div class="dim small">If you want this team to have its membership populated from an .rocks community, you will need to get the community ID and API key from the community's settings and add them here. Do not do this unless you trust the enl.rocks community.</div>
</form>
    <button id="rockspull">Pull associated enl.rocks community members onto this team</button>
   </div>
  </div>
 <div class="card mb-2">
  <div class="card-header">Send Announcement</div>
   <div class="card-body">
    <textarea name="m" id="announceContent"></textarea>
    <button id="announce">Send</button>
   </div>
  </div>
 <div class="card mb-2">
  <div class="card-header">Change Ownership</div>
   <div class="card-body">
    <input type="text" placeholder="new owner" id="newOwner"></input>
    <div class="dim small">agent name or googleID -- once you change ownership, you can no longer manage this team</div>
   </div>
  </div>
 <div class="card mb-2">
  <div class="card-header">Team Info</div>
   <div class="card-body">
    Wasabee Team ID: <span id="teamid"></span>
   </div>
  </div>
</div></div></div>
`;

  const teamid = document.getElementById("teamid");
  const teamName = document.getElementById("teamName");
  const rockscomm = document.getElementById("rockscomm");
  const rockskey = document.getElementById("rockskey");
  const rockspull = document.getElementById("rockspull");
  const newOwner = document.getElementById("newOwner");
  const joinLink = document.getElementById("joinLink");

  loadTeam(teamID).then(
    (json) => {
      let team = null;
      try {
        team = JSON.parse(json);
      } catch (e) {
        console.log(e);
        notify(e);
        return;
      }

      teamName.textContent = team.name;
      teamid.textContent = team.id;
      if (team.rc) rockscomm.value = team.rc;
      L.DomEvent.on(rockscomm, "change", (ev) => {
        L.DomEvent.stop(ev);
        alert("coming soon");
      });
      if (team.rk) rockskey.value = team.rk;
      L.DomEvent.on(rockskey, "change", (ev) => {
        L.DomEvent.stop(ev);
        alert("coming soon");
      });
      L.DomEvent.on(rockspull, "click", (ev) => {
        L.DomEvent.stop(ev);
        alert("coming soon");
      });
      L.DomEvent.on(newOwner, "change", (ev) => {
        L.DomEvent.stop(ev);
        changeTeamOwnerPromise(team.id, newOwner.value).then(
          () => {
            list(teamID);
          },
          (reject) => {
            newOwner.value = "";
            console.log(reject);
            notify(reject);
          }
        );
      });
      // join link
      if (team.jlt) {
        joinLink.innerHTML = `<a href="/api/v1/team/${team.id}/join/${team.jlt}">copy this link</a> to share with agents`;
        const dbutton = L.DomUtil.create("button", null, joinLink);
        dbutton.textContent = "remove";
        L.DomEvent.on(dbutton, "click", () => {
          deleteJoinLinkPromise(team.id).then(
            () => {
              joinLink.textContent = "deleted";
            },
            (reject) => {
              console.log(reject);
              notify(reject);
            }
          );
        });
      } else {
        const generate = L.DomUtil.create("button", null, joinLink);
        generate.textContent = "Generate Join Link";
        L.DomEvent.on(generate, "click", (ev) => {
          L.DomEvent.stop(ev);
          createJoinLinkPromise(team.id).then(
            () => {
              notify("Join link created");
              // XXX this is hackish, the server should respond with the token
              joinLink.textContent = "refresh to update";
            },
            (reject) => {
              joinLink.textContent = "unable to create link";
              console.log(reject);
              notify(reject);
            }
          );
        });
      }
    },
    (reject) => {
      console.log(reject);
      notify(reject);
    }
  );
}
