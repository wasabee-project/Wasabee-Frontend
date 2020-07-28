import WasabeeMe from "./me";
import { startSendLoc, stopSendLoc } from "./server";
import { logEvent } from "./firebase";

export function displaySettings() {
  logEvent("screen_view", { screen_name: "settings" });
  history.pushState({ screen: "settings" }, "settings", "#settings");

  const me = WasabeeMe.get();
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);
  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  // <title>{{.IngressName}} Agent data</title>

  content.innerHTML = `
<div class="container">
<div class="row">
<div class="col">
<h1>Settings</h1>
 <div class="content-area">
  <div class="card mb-2">
   <div class="card-header">Agent Info</div>
   <div class="card-body">
    <div>Display Name: <span class="agent-name">${me.IngressName}</span>
     <p><em>This information comes from <a href="https://v.enl.one/">V</a> and/or <a href="https://enlightened.rocks">.rocks</a>. If you have an UnverifiedAgent_ name, please ensure your .Rocks and V information is correct.</em></p>
    </div>
    <div>GoogleID: <span class="agent-name">${me.GoogleID}</span></div>
    <div>Level: <span class="agent-name">${me.Level}</span></div>
    <div><a href="https://v.enl.one/" target="_new">V Status</a>: <span id="vstatus"></div>
    <div><a href="https://enl.rocks/" target="_new">enl.rocks Status</a>: <span id="rocksstatus">
     <p><em><a href="#tooltip" class="tooltip-display" data-toggle="tooltip" title=".Rocks verification typically only takes place in relationship to anomolies. Lack of verification does not mean you don't have a .rocks account, it just means you've not been verified at an anomaly event">What is .Rocks verification?</a></em></p>
    </div>
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
  if (me.VVerified) {
    vstatus.innerHTML = `<a href="https://v.enl.one/profile/${me.Vid}" target="_new">verified</a>`;
  } else {
    vstatus.textContent = "not verified";
  }
  const rocksstatus = document.getElementById("rocksstatus");
  if (me.RocksVerified) {
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
        tg.innerHTML = `Tell the bot (<a href="tg://resolve?domain=${window.wasabeewebui.botname}">@${window.wasabeewebui.botname}</a>) <a href="https://telegram.me/${window.wasabeewebui.botname}?start=${me.Telegram.Authtoken}">${me.Telegram.Authtoken}</a> to conclude verification.`;
      } else {
        tg.innerHTML = `Tell the bot (<a href="tg://resolve?domain=${window.wasabeewebui.botname}">@${window.wasabeewebui.botname}</a>) <a href="https://telegram.me/${window.wasabeewebui.botname}?start=${me.LocationKey}">${me.LocationKey}</a> to start the verification process.`;
      }
    }
  } else {
    tg.innerHTML = `Tell the bot (<a href="tg://resolve?domain=${window.wasabeewebui.botname}">@${window.wasabeewebui.botname}</a>) <a href="https://telegram.me/${window.wasabeewebui.botname}?start=${me.LocationKey}">${me.LocationKey}</a> to start the verification process.`;
  }
}
