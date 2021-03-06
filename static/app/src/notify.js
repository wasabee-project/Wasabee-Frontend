import { logEvent } from "./firebase";
// valid levels: primary, secondary, success, danger, warning, info, light, dark
import eventHub from "./eventHub";

export function notify(msg, level = "primary", log = true) {
  eventHub.$emit("notify", { message: msg, level: level });
  // const container = document.getElementById("wasabeeAlerts");

  // const n = L.DomUtil.create(
  //   "div",
  //   "alert alert-dismissible fade show",
  //   container
  // );
  // L.DomUtil.addClass(n, "alert-" + level);
  // n.role = "alert";
  // n.textContent = msg;
  // const b = L.DomUtil.create("button", "close", n);
  // // b.setAttribute("data-dismiss", "alert");
  // b.setAttribute("data-bs-dismiss", "alert");
  // b.ariaLabel = "close";
  // L.DomEvent.on(b, "click", () => n.remove());
  // const s = L.DomUtil.create("span", null, b);
  // s.textContent = "X";
  // s.ariaHidden = "true";

  // // clear messages after 3 seconds
  // setTimeout(() => {
  //   b.click();
  // }, 3000);

  if (log) {
    logEvent("exception", { description: msg, fatal: false });
  }
}
