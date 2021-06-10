import WasabeeMe from "./me";
import { startSendLoc, stopSendLoc } from "./loc";
import { logEvent } from "./firebase";
import { notify } from "./notify";
import { setVAPIkey, importVteams } from "./server";

export function displaySettings() {
  logEvent("screen_view", { screen_name: "settings" });
  history.pushState({ screen: "settings" }, "settings", "#settings");

  const me = WasabeeMe.cacheGet();
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);
  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  // <title>{{.name}} Agent data</title>

  content.innerHTML = `
<div class="container">
<div class="row">
<div class="col">
<h1>Settings</h1>
 <div class="content-area">
  <div class="card mb-2">
   <div class="card-header">Agent Info</div>
   <div class="card-body">
    <div>Wasabee Name: <span class="agent-name">${me.name}</span></div>
    <div>V Name: <span class="agent-name">${me.vname}</span></div>
    <div><a href="https://v.enl.one/" target="_new">V Status</a>: <span id="vstatus"></div>
    <div>Rocks Name: <span class="agent-name">${me.rocksname}</span></div>
    <div><a href="https://enl.rocks/" target="_new">enl.rocks Status</a>: <span id="rocksstatus">
     <p><em><a href="#tooltip" class="tooltip-display" data-toggle="tooltip" title=".Rocks verification typically only takes place in relationship to anomolies. Lack of verification does not mean you don't have a .rocks account, it just means you've not been verified at an anomaly event">What is .Rocks verification?</a></em></p>
    </div>
    <div>GoogleID: <span class="agent-name">${me.GoogleID}</span></div>
    <div>Level: <span class="agent-name">${me.level}</span>
     <p><em>This information comes from <a href="https://v.enl.one/">V</a> and/or <a href="https://enlightened.rocks">.rocks</a>. If you have an UnverifiedAgent_ name, please ensure your .Rocks and V information is correct.</em></p>
   </div>
    <div>Intel Name: <span class="agent-name">${me.intelname}</span></div>
    <!-- <div>Intel Faction: <span class="agent-name">${me.intelfaction}</span> -->
     <p><em>This information is set by the IITC plugin. It should not be trusted for authorization.</em></p>
	</div>
  </div>
  <div class="card mb-2">
   <div class="card-header">Options</div>
   <div class="card-body">
    <label>Send Location: <input id="locCheck" type="checkbox"></label><br />
    <label>Enable Anonymous Analytics: <input id="analytics" type="checkbox"></label> <span class="small dim">(this helps the developers improve Wasabee)</span>
   </div>
  </div>
  <div class="card mb-2">
   <div class="card-header">Telegram</div>
   <div class="card-body">
    <div id="telegramContent"></div>
   </div>
  </div>
  <div class="card mb-2">
   <div class="card-header">One Time Token</div>
   <div class="card-body">
    <div id="ott"></div>
    <div class="small dim">Use this to log into Wasabee-IITC if Google Oauth2 and Webview both fail</div>
   </div>
  </div>
  <div class="card mb-2">
   <div class="card-header">V API token</div>
   <div class="card-body">
    <div id="vapidiv"><input type="text" id="vapi" placeholder="0123456789abcdef0123456789abcdef0123456789"/></div>
    <div class="small dim">If you need to sync V teams with Wasabee, enter a valid V API token.</div>
   </div>
  </div>
 </div>
  <div class="card mb-2">
   <div class="card-header">V team import</div>
   <div class="card-body">
    <div id="vapidiv">
	<select name="vimportmode" id="vimportmode">
	 <option value="team">Create one Wasabee team per V team</option>
	 <option value="role">Create one Wasabee team per V team/role pair</option>
	 </select>
	<input type="button" id="vimport" value="V team import">
	</div>
    <div class="small dim">This can potentially create a large number of Wasabee teams at once. Only use this if you are sure you need it.</div>
   </div>
  </div>
 </div>
</div>
</div>`;

  // $('[data-toggle="tooltip"]').tooltip();

  const locCheck = document.getElementById("locCheck");
  if (localStorage["sendLocation"] == "true") locCheck.checked = true;
  L.DomEvent.on(locCheck, "change", () => {
    localStorage["sendLocation"] = locCheck.checked;
    if (locCheck.checked) startSendLoc();
    else stopSendLoc();
  });

  const analytics = document.getElementById("analytics");
  if (localStorage["analytics"] == "true") analytics.checked = true;
  L.DomEvent.on(analytics, "change", () => {
    localStorage["analytics"] = analytics.checked;
  });

  const vstatus = document.getElementById("vstatus");
  if (me.Vverified) {
    vstatus.innerHTML = `<a href="https://v.enl.one/profile/${me.enlid}" target="_new">verified</a>`;
  } else {
    vstatus.textContent = "not verified";
  }
  const rocksstatus = document.getElementById("rocksstatus");
  if (me.rocks) {
    rocksstatus.textContent = "verified";
  } else {
    rocksstatus.textContent = "not verified";
  }

  const tg = document.getElementById("telegramContent");
  if (me.Telegram) {
    if (me.Telegram.Verified) {
      tg.innerHTML = `<div>Telegram ID: ${me.Telegram.ID} (verified)</div>`;
    } else {
      if (me.Telegram.Authtoken) {
        tg.innerHTML = `Step 2: Tell the bot (<a href="tg://resolve?domain=${window.wasabeewebui.botname}">@${window.wasabeewebui.botname}</a>) <a href="https://telegram.me/${window.wasabeewebui.botname}?start=${me.Telegram.Authtoken}">${me.Telegram.Authtoken}</a> to conclude verification.`;
      } else {
        tg.innerHTML = `Step 1: Tell the bot (<a href="tg://resolve?domain=${window.wasabeewebui.botname}">@${window.wasabeewebui.botname}</a>) <a href="https://telegram.me/${window.wasabeewebui.botname}?start=${me.lockey}">${me.lockey}</a> to start the verification process. If you have sent this to the bot and this step still shows here, log out and back in.`;
        // XXX add refresh button with FORCE option set on fetching /me
      }
    }
  } else {
    tg.innerHTML = `Tell the bot (<a href="tg://resolve?domain=${window.wasabeewebui.botname}">@${window.wasabeewebui.botname}</a>) <a href="https://telegram.me/${window.wasabeewebui.botname}?start=${me.lockey}">${me.lockey}</a> to start the verification process.`;
  }

  const ott = document.getElementById("ott");
  ott.textContent = me.lockey;

  const vapi = document.getElementById("vapi");
  vapi.value = me.vapi;
  L.DomEvent.on(vapi, "change", async () => {
    try {
      await setVAPIkey(vapi.value);
      notify("V API Key updated", "success");
    } catch (e) {
	  console.log(e);
      notify("V API Key update failed", "warning", true);
    }
  });

  const vimport = document.getElementById("vimport");
  L.DomEvent.on(vimport, "click", async () => {
    try {
      notify("starting V team import");
      const vimportmode = document.getElementById("vimportmode");
	  await importVteams(vimportmode.value);
      notify("V team import complete", "success");
    } catch (e) {
	  console.log(e);
	  notify("V team import failed (or is still being processed)", "warning", true)
	}
  });
}
