import { GetWasabeeServer } from "./server";

export default class WasabeeAgent {
  constructor() {
    this.id = null;
    this.name = null;
    this.lat = 0;
    this.lng = 0;
    this.date = null;
    this.pic = null;
    this.cansendto = false;
    this.Vverified = false;
    this.blacklisted = false;
    this.rocks = false;
    this.squad = null;
    this.state = null;
  }

  static create(obj) {
    if (typeof obj == "string") {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        console.log(e);
        return null;
      }
    }
    const a = new WasabeeAgent();
    a.id = obj.id;
    a.name = obj.name;
    a.lat = obj.lat;
    a.lng = obj.lng;
    a.date = obj.date;
    a.pic = obj.pic;
    a.cansendto = obj.cansendto;
    a.Vverified = obj.Vverified;
    a.blacklisted = obj.blacklisted;
    a.rocks = obj.rocks;
    a.squad = obj.squad;
    a.state = obj.state;

    return a;
  }

  get latLng() {
    if (this.lat && this.lng) return new L.LatLng(this.lat, this.lng);
    return null;
  }

  formatDisplay() {
    const server = GetWasabeeServer();
    const display = L.DomUtil.create("a", "wasabee-agent-label");
    if (this.Vverified || this.rocks) {
      L.DomUtil.addClass(display, "enl");
    }
    if (this.blacklisted) {
      L.DomUtil.addClass(display, "res");
    }
    display.href = `${server}/api/v1/agent/${this.id}?json=n`;
    display.target = "_new";
    L.DomEvent.on(display, "click", (ev) => {
      window.open(display.href, this.id);
      L.DomEvent.stop(ev);
    });
    display.textContent = this.name;
    return display;
  }
}
