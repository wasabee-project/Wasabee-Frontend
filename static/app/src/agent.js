// this is reset on each reload, but works fine for normal screen-changing
const agentCache = new Map();

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

    agentCache.set(a.id, a);

    return a;
  }

  get latLng() {
    if (this.lat && this.lng) return new L.LatLng(this.lat, this.lng);
    return null;
  }

  // an agent may be on multiple teams and have a different display name on each, this could be ugly
  static get(id) {
    if (agentCache.has(id)) return agentCache.get(id);
    return null;
  }
}
