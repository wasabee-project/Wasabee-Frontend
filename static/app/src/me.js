// very different from IITC version
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
    this.IngressName = obj.IngressName;
    this.Level = obj.Level;
    this.VVerified = obj.VVerified;
    this.VBlacklisted = obj.VBlacklisted;
    this.Vid = obj.Vid;
    this.RocksVerified = obj.RocksVerified;
    this.LocationKey = obj.LocationKey;
    if (obj.Telegram) {
      this.Telegram = {};
      this.Telegram.ID = obj.Telegram.ID;
      this.Telegram.Verified = obj.Telegram.Verified;
      this.Telegram.Authtoken = obj.Telegram.Authtoken;
    }

    this.OwnedTeams = Array();
    if (obj.OwnedTeams && obj.OwnedTeams.length > 0) {
      for (const team of obj.OwnedTeams) {
        this.OwnedTeams.push(team);
      }
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

    this.Assignments = Array();
    if (obj.Assignments && obj.Assignments.length > 0) {
      for (const assignment of obj.Assignments) {
        this.Assignments.push(assignment);
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

  static get() {
    return new WasabeeMe(localStorage[AGENT_INFO_KEY]);
  }
}

export default WasabeeMe;
