import WasabeeMe from "./me";
import WasabeeOp from "./operation";
import {
  getSelectedOperation,
  getOperationByID,
  removeOperation,
} from "./selectedOp";
import wX from "./wX";
import WasabeeMarker from "./marker";

export default function () {
  return GetWasabeeServer();
}

// uploads an op to the server
// refreshed op stored to localStorage; "me" upated to reflect new op in list
export async function uploadOpPromise() {
  const operation = getSelectedOperation();
  operation.cleanAll();
  const json = JSON.stringify(operation);

  const response = await genericPost(
    "/api/v1/draw",
    json,
    "application/json;charset=UTF-8"
  );
  const newme = new WasabeeMe(response);
  newme.store();
  const newop = await opPromise(operation.ID);
  newop.localchanged = false;
  newop.store();
  return newop;
}

// sends a changed op to the server
export function updateOpPromise(operation) {
  // let the server know how to process assignments etc
  operation.mode = window.plugin.wasabee.static.constants.MODE_KEY;
  operation.cleanAll();
  const json = JSON.stringify(operation);
  delete operation.mode;

  return genericPut(
    `/api/v1/draw/${operation.ID}`,
    json,
    "application/json;charset=UTF-8"
  );
}

// removes an op from the server
export function deleteOpPromise(opID) {
  return genericDelete(`/api/v1/draw/${opID}`, new FormData());
}

// returns a promise to a WasabeeTeam -- used only by WasabeeTeam.waitGet
// use WasabeeTeam.waitGet and WasabeeTeam.cacheGet
export function teamPromise(teamid) {
  return genericGet(`/api/v1/team/${teamid}`);
}

// returns a promise to fetch a WasabeeOp
// local change: If the server's copy is newer than the local copy, otherwise none
// not generic since 304 result processing and If-Modified-Since header
export async function opPromise(opID) {
  let ims = "Sat, 29 Oct 1994 19:43:31 GMT"; // the dawn of time...
  const localop = getOperationByID(opID);
  if (localop != null && localop.fetched) ims = localop.fetched;

  try {
    const response = await fetch(GetWasabeeServer() + `/api/v1/draw/${opID}`, {
      method: "GET",
      mode: "cors",
      cache: "default",
      credentials: "include",
      redirect: "manual",
      referrerPolicy: "origin",
      header: { "If-Modified-Since": ims },
    });

    let raw = null;
    let newop = null; // I hate javascript
    switch (response.status) {
      case 200:
        raw = await response.json();
        newop = new WasabeeOp(raw);
        newop.localchanged = false;
        return Promise.resolve(newop);
      case 304: // If-Modified-Since replied NotModified
        console.log("server copy is older/unmodified, keeping local copy");
        localop.localchanged = true;
        return Promise.resolve(localop);
      case 401:
        WasabeeMe.purge();
        raw = await response.json();
        return Promise.reject(wX("NOT LOGGED IN", raw.error));
      case 403:
        removeOperation(opID);
        raw = await response.json();
        return Promise.reject(wX("OP PERM DENIED", opID) + ": " + raw.error);
      case 410:
        removeOperation(opID);
        raw = await response.json();
        return Promise.reject(wX("OP DELETED", opID) + ": " + raw.error);
      default:
        raw = await response.text();
        return Promise.reject(response.statusText, raw);
    }
  } catch (e) {
    console.log(e);
    return Promise.reject(e);
  }
}

// returns a promise to WasabeeMe -- should be called only by WasabeeMe.waitGet()
// use WasabeeMe.cacheGet or WasabeeMe.waitGet for caching
export async function mePromise() {
  try {
    const response = await genericGet("/me?json=y");
    return response;
  } catch (e) {
    console.log(e);
    return e;
  }
}

// returns a promise to get the agent's JSON data from the server -- should be called only by WasabeeAgent.waitGet()
// use WasabeeAgent.waitGet and WasabeeAgent.cacheGet for caching
export function agentPromise(GID) {
  return genericGet(`/api/v1/agent/${GID}`);
}

// local change: none // cache: none
export function assignMarkerPromise(opID, markerID, agentID) {
  const fd = new FormData();
  fd.append("agent", agentID);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/assign`, fd);
}

// performs a link assignment on the server, sending notifications
export function assignLinkPromise(opID, linkID, agentID) {
  const fd = new FormData();
  fd.append("agent", agentID);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/assign`, fd);
}

// sends a target (portal) to the server to notify the agent
export function targetPromise(agentID, portal) {
  const ll = portal.lat + "," + portal.lng;
  const fd = new FormData();
  fd.append("id", agentID);
  fd.append("portal", portal.name);
  fd.append("ll", ll);
  return genericPost(`/api/v1/agent/${agentID}/target`, fd);
}

// work in progress -- server support not finished
export function routePromise(agentID, portal) {
  const ll = portal.lat + "," + portal.lng;
  const fd = new FormData();
  fd.append("id", agentID);
  fd.append("portal", portal.name);
  fd.append("ll", ll);
  return genericPost(`/api/v1/agent/${agentID}/route`, fd);
}

// returns a promise to /me if the access token is valid
export function SendAccessTokenAsync(accessToken) {
  return genericPost(
    "/aptok",
    JSON.stringify({ accessToken: accessToken }),
    "application/json;charset=UTF-8"
  );
}

// changes agent's team state on the server; return value is status message
export function SetTeamState(teamID, state) {
  return genericGet(`/api/v1/me/${teamID}?state=${state}`);
}

// changes a markers status on the server, sending relevant notifications
export function SetMarkerState(opID, markerID, state) {
  let action = "incomplete";
  switch (state) {
    case "acknowledged":
      action = "acknowledge";
      break;
    case "pending":
      action = "incomplete";
      break;
    case "completed":
      action = "complete";
      break;
    default:
      action = "incomplete";
  }

  return genericGet(`/api/v1/draw/${opID}/marker/${markerID}/${action}`);
}

// changes a link's status on the server, sending relevant notifications
export function SetLinkState(opID, linkID, state) {
  let action = "incomplete";
  switch (state) {
    // no acknowledge for links -- use incomplete
    case "pending":
      action = "incomplete";
      break;
    case "completed":
      action = "complete";
      break;
    default:
      action = "incomplete";
  }

  return genericGet(`/api/v1/draw/${opID}/link/${linkID}/${action}`);
}

// updates an agent's key count, return value is status code
export function opKeyPromise(opID, portalID, onhand, capsule) {
  const fd = new FormData();
  fd.append("onhand", onhand);
  fd.append("capsule", capsule);
  return genericPost(`/api/v1/draw/${opID}/portal/${portalID}/keyonhand`, fd);
}

// updates an agent's defensive key count, return value is status code
export function dKeyPromise(portalID, onhand, capsule) {
  const fd = new FormData();
  fd.append("portalID", portalID ? portalID : "");
  fd.append("count", onhand ? onhand : "0");
  fd.append("capID", capsule ? capsule : "");
  return genericPost("/api/v1/d", fd);
}

// returns a promise to a list of defensive keys for all enabled teams
export function dKeylistPromise() {
  return genericGet("/api/v1/d");
}

// updates an agent's location ; return value is status code
export function locationPromise(lat, lng) {
  return genericGet(`/api/v1/me?lat=${lat}&lon=${lng}`);
}

// sets logout status on the server; return value is status code
export function logoutPromise() {
  return genericGet("/api/v1/me/logout");
}

// adds a permission to an op; return value is status code
export function addPermPromise(opID, teamID, role) {
  const fd = new FormData();
  fd.append("team", teamID);
  fd.append("role", role);
  return genericPost(`/api/v1/draw/${opID}/perms`, fd);
}

// removes a permission from an op; return value is status code
export function delPermPromise(opID, teamID, role) {
  const fd = new FormData();
  fd.append("team", teamID);
  fd.append("role", role);
  return genericDelete(`/api/v1/draw/${opID}/perms`, fd);
}

// removes the agent from the team; return value is status code
export function leaveTeamPromise(teamID) {
  return genericDelete(`/api/v1/me/${teamID}`, new FormData());
}

// removes another agent from an owned team ; return value is status code
export function removeAgentFromTeamPromise(agentID, teamID) {
  return genericDelete(`/api/v1/team/${teamID}/${agentID}`, new FormData());
}

// local change: none // cache: none
export function setAgentTeamSquadPromise(agentID, teamID, squad) {
  const fd = new FormData();
  fd.append("squad", squad);
  return genericPost(`/api/v1/team/${teamID}/${agentID}/squad`, fd);
}

// local change: none // cache: none
export function addAgentToTeamPromise(agentID, teamID) {
  return genericPost(`/api/v1/team/${teamID}/${agentID}`, new FormData());
}

// local change: none // cache: none
export function renameTeamPromise(teamID, name) {
  const fd = new FormData();
  fd.append("teamname", name);
  return genericPut(`/api/v1/team/${teamID}/rename`, fd);
}

// local change: none // cache: none
export function rocksPromise(teamID, community, apikey) {
  return genericGet(
    `/api/v1/team/${teamID}/rockscfg?rockscomm=${community}&rockskey=${apikey}`
  );
}

// local change: none // cache: none
export function newTeamPromise(name) {
  return genericGet(`/api/v1/team/new?name=${name}`);
}

// local change: none // cache: none
export function deleteTeamPromise(teamID) {
  return genericDelete(`/api/v1/team/${teamID}`, new FormData());
}

// local change: none // cache: none
export function oneTimeToken(token) {
  const url = "/oneTimeToken";
  const fd = new FormData();
  fd.append("token", token);
  return genericPost(url, fd);
}

async function genericPut(url, formData, contentType = "multipart/form-data") {
  try {
    const response = await fetch(GetWasabeeServer() + url, {
      method: "PUT",
      mode: "cors",
      cache: "default",
      credentials: "include",
      redirect: "manual",
      referrerPolicy: "origin",
      headers: { "Content-Type": contentType },
      body: formData,
    });

    let err = null;
    switch (response.status) {
      case 200:
        // returns a promise to the content
        // I think all the PUTS return a JSON "OK"
        return response.text();
      // break;
      case 401:
        WasabeeMe.purge();
        err = await response.json();
        return Promise.reject(wX("NOT LOGGED IN", err.error));
      // break;
      default:
        err = await response.text();
        return Promise.reject(response.statusText, err);
      // break;
    }
  } catch (e) {
    console.log(e);
    return Promise.reject(e);
  }
}

async function genericPost(url, formData, contentType) {
  try {
    const construct = {
      method: "POST",
      mode: "cors",
      cache: "default",
      credentials: "include",
      redirect: "manual",
      referrerPolicy: "origin",
      body: formData,
    };
    if (contentType != null) {
      construct.headers = { "Content-Type": contentType };
    }
    const response = await fetch(GetWasabeeServer() + url, construct);

    let err = null;
    switch (response.status) {
      case 200:
        // returns a promise to the content
        return response.text();
      // break;
      case 401:
        WasabeeMe.purge();
        err = await response.json();
        return Promise.reject(wX("NOT LOGGED IN", err.error));
      // break;
      default:
        err = await response.text();
        return Promise.reject(response.statusText, err);
      // break;
    }
  } catch (e) {
    console.log(e);
    return Promise.reject(e);
  }
}

async function genericDelete(url, formData) {
  try {
    const response = await fetch(GetWasabeeServer() + url, {
      method: "DELETE",
      mode: "cors",
      cache: "default",
      credentials: "include",
      redirect: "manual",
      referrerPolicy: "origin",
      headers: { "Content-Type": "multipart/form-data" },
      body: formData,
    });

    let err = null;
    switch (response.status) {
      case 200:
        // returns a promise to the content
        return response.text();
      // break;
      case 401:
        WasabeeMe.purge();
        err = await response.json();
        return Promise.reject(wX("NOT LOGGED IN", err.error));
      // break;
      default:
        err = await response.text();
        return Promise.reject(response.statusText, err);
      // break;
    }
  } catch (e) {
    console.log(e);
    return Promise.reject(e);
  }
}

async function genericGet(url) {
  try {
    const response = await fetch(GetWasabeeServer() + url, {
      method: "GET",
      mode: "cors",
      cache: "default",
      credentials: "include",
      redirect: "manual",
      referrerPolicy: "origin",
    });

    let err = null;
    switch (response.status) {
      case 200:
        // returns a promise to the content
        return response.text();
      // break;
      case 401:
        WasabeeMe.purge();
        err = await response.json();
        return Promise.reject(wX("NOT LOGGED IN", err.error));
      // break;
      case 403:
        err = await response.json();
        return Promise.reject(err.error);
      // break;
      default:
        err = await response.text();
        return Promise.reject(response.statusText, err);
      // break;
    }
  } catch (e) {
    console.log(e);
    return Promise.reject(e);
  }
}

export function GetWasabeeServer() {
  // Wasabee-IITC, use the configured server
  if (window.plugin && window.plugin.wasabee) {
    let server =
      localStorage[window.plugin.wasabee.static.constants.SERVER_BASE_KEY];
    if (server == null) {
      server = window.plugin.wasabee.static.constants.SERVER_BASE_DEFAULT;
      localStorage[
        window.plugin.wasabee.static.constants.SERVER_BASE_KEY
      ] = server;
    }
    return server;
  }
  // Wasabee-WebUI doesn't need to specify the server
  return "";
}

export function SetWasabeeServer(server) {
  // XXX sanity checking here please:
  // starts w/ https://
  // does not end with /
  localStorage[window.plugin.wasabee.static.constants.SERVER_BASE_KEY] = server;
}

/* The following are for Wasabee-WebUI and not used in Wasabee-IITC */

// in the service-worker for IITC
export function sendTokenToWasabee(token) {
  // no need for a form-data, just send the raw token
  return genericPost(`/api/v1/me/firebase`, token);
}

export function loadConfig() {
  return genericGet(`/static/wasabee-webui-config.json`);
}

export function setDisplayName(teamID, googleID, displayname) {
  const fd = new FormData();
  fd.append("displayname", displayname);
  return genericPost(`/api/v1/team/${teamID}/${googleID}/displayname`, fd);
}

export function changeTeamOwnerPromise(teamID, newOwner) {
  return genericGet(`/api/v1/team/${teamID}/chown?to=${newOwner}`);
}

export function createJoinLinkPromise(teamID) {
  return genericGet(`/api/v1/team/${teamID}/genJoinKey`);
}

export function deleteJoinLinkPromise(teamID) {
  return genericGet(`/api/v1/team/${teamID}/delJoinKey`);
}

export function setAssignmentStatus(op, object, completed) {
  let type = "link";
  if (object instanceof WasabeeMarker) type = "marker";
  let c = "incomplete";
  if (completed) c = "complete";

  return genericGet(`/api/v1/draw/${op.ID}/${type}/${object.ID}/${c}`);
}

export function sendAnnounce(teamID, message) {
  const fd = new FormData();
  fd.append("m", message);
  return genericPost(`/api/v1/team/${teamID}/announce`, fd);
}

export function pullRocks(teamID) {
  return genericGet(`/api/v1/team/${teamID}/rocks`);
}

export function reverseLinkDirection(opID, linkID) {
  return genericGet(`/api/v1/draw/${opID}/link/${linkID}/swap`);
}

export function setMarkerComment(opID, markerID, comment) {
  const fd = new FormData();
  fd.append("comment", comment);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/comment`, fd);
}

export function setLinkComment(opID, linkID, desc) {
  const fd = new FormData();
  fd.append("desc", desc);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/desc`);
}
