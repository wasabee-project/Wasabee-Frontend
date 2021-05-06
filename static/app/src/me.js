// very different from IITC version
import { mePromise } from "./server";

const AGENT_INFO_KEY = "me";

export class WasabeeMe {
  constructor(json) {
    let obj = null;
    try {
      obj = JSON.parse(json);
    } catch (e) {
      console.log(e);
      return;
    }

    this.fetched = obj.fetched ? obj.fetched : Date.now();
    this.GoogleID = obj.GoogleID;
    this.name = obj.name;
    this.vname = obj.vname;
    this.rocksname = obj.rocksname;
    this.intelname = obj.intelname;
    this.level = obj.level;
    this.Vverified = obj.Vverified;
    this.blacklisted = obj.blacklisted;
    this.enlid = obj.enlid;
    this.rocks = obj.rocks;
    this.querytoken = obj.querytoken;
    this.pic = obj.pic;
    this.intelfaction = obj.intelfaction;
    this.lockey = obj.lockey;
    this.querytoken = obj.lockey;

    if (obj.Telegram) {
      this.Telegram = {};
      this.Telegram.ID = obj.Telegram.ID;
      this.Telegram.Verified = obj.Telegram.Verified;
      this.Telegram.Authtoken = obj.Telegram.Authtoken;
    }

    this.Teams = Array();
    if (obj.Teams !== null) {
      for (const team of obj.Teams) {
        this.Teams.push(team);
      }
    }

    this.Ops = Array();
    if (obj.Ops && obj.Ops.length > 0) {
      for (const op of obj.Ops) {
        this.Ops.push(op);
      }
    }
  }

  // default
  toJSON() {
    return this;
  }

  store() {
    localStorage[AGENT_INFO_KEY] = JSON.stringify(this);
  }

  static remove() {
    delete localStorage[AGENT_INFO_KEY];
  }

  static cacheGet() {
    const raw = localStorage[AGENT_INFO_KEY];
    if (raw == null) return null;
    return new WasabeeMe(raw);
  }

  static async waitGet(force = false) {
    if (!force) {
      const lsme = localStorage[AGENT_INFO_KEY];
      if (lsme) {
        const maxCacheAge = Date.now() - 1000 * 60 * 60;
        const l = new WasabeeMe(lsme);
        if (l.fetched && l.fetched > maxCacheAge) {
          return l;
        }
      }
    }

    try {
      const raw = await mePromise();
      const me = new WasabeeMe(raw);
      return me;
    } catch (e) {
      console.log(e);
    }
    return null;
  }
}

export default WasabeeMe;
