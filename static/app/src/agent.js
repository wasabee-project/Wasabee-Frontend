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
    this.level = obj.level ? Number(obj.level) : 0;
    this.enlid = obj.enlid ? obj.enlid : 0;
    this.pic = obj.pic ? obj.pic : null;
    this.Vverified = obj.Vverified ? obj.Vverified : false;
    this.blacklisted = obj.blacklisted ? obj.blacklisted : false;
    this.rocks = obj.rocks ? obj.rocks : false;
    this.lat = obj.lat ? obj.lat : 0;
    this.lng = obj.lng ? obj.lng : 0;
    this.date = obj.date ? obj.date : null;
    this.cansendto = obj.cansendto ? obj.cansendto : false; // never true from a team pull
    this.ShareWD = obj.ShareWD;
    this.LoadWD = obj.LoadWD;
    this.startlat = obj.startlat ? obj.startlat : 0;
    this.startlng = obj.startlng ? obj.startlng : 0;
    this.startradius = obj.startradius ? Number(obj.startradius) : 0;
    this.sharestart = obj.sharestart ? obj.sharestart : false;

    // distance, dispayname, squad and state are meaningless in the cache since you cannot know which team set them
    this.distance = obj.distance ? Number(obj.distance) : 0; // don't use this
    this.squad = obj.squad ? obj.squad : null;
    this.state = obj.state;

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
