import { agentPromise } from "./server";

const agentCache = new Map();

export default class WasabeeAgent {
  constructor(obj) {
    if (typeof obj == "string") {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        console.log(e);
        obj = {};
      }
    }

    this.id = obj.id;
    this.name = obj.name; // XXX gets messy in the cache if team display name is set
    this.lat = obj.lat ? obj.lat : 0;
    this.lng = obj.lng ? obj.lng : 0;
    this.date = obj.date ? obj.date : null;
    this.pic = obj.pic ? obj.pic : null;
    this.cansendto = obj.cansendto ? obj.cansendto : false;
    this.Vverified = obj.Vverified ? obj.Vverified : false;
    this.blacklisted = obj.blacklisted ? obj.blacklisted : false;
    this.rocks = obj.rocks ? obj.rocks : false;

    // squad and state are meaningless in the cache since you can never know which team set them
    this.squad = obj.squad ? obj.squad : null;
    this.state = obj.state;
    this.ShareWD = obj.ShareWD;

    // push the new data into the agent cache
    agentCache.set(this.id, this);
  }

  get latLng() {
    if (this.lat && this.lng) return new L.LatLng(this.lat, this.lng);
    return null;
  }

  static cacheGet(gid) {
    if (agentCache.has(gid)) {
      return agentCache.get(gid);
    }
    return null;
  }

  static async waitGet(gid) {
    if (agentCache.has(gid)) {
      return agentCache.get(gid);
    }

    try {
      const result = await agentPromise(gid);
      const newagent = new WasabeeAgent(result);
      return newagent;
    } catch (e) {
      console.log(e);
    }
    return null;
  }
}
