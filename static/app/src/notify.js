import { logEvent } from "./firebase";
// valid levels: primary, secondary, success, danger, warning, info, light, dark

export function notify(msg, level = "primary", log = true) {
  const container = document.getElementById("wasabeeAlerts");

  const n = L.DomUtil.create(
    "div",
    "alert alert-dismissible fade show",
    container
  );
  L.DomUtil.addClass(n, "alert-" + level);
  n.role = "alert";
  n.textContent = msg;
  const b = L.DomUtil.create("button", "close", n);
  b.setAttribute("data-dismiss", "alert");
  b.ariaLabel = "close";
  const s = L.DomUtil.create("span", null, b);
  s.textContent = "X";
  s.ariaHidden = "true";

  // data-dismiss takes care of this for us
  // L.DomEvent.on(n, "click", () => { n.alert("close"); n.alert("dispose"); });
  //
  if (log) {
    logEvent("exception", { description: msg, fatal: false });
  }
}
