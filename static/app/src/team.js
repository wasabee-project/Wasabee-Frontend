import WasabeeAgent from "./agent";
import { teamPromise } from "./server";

const teamcache = new Map();

export default class WasabeeTeam {
  constructor(data) {
    if (typeof data == "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log("corrupted team");
        return null;
      }
    }

    this.agents = new Array();
    this.id = data.id;
    this.name = data.name;
    this.fetched = Date.now();

    // convert to WasabeeAgents and push them into the agent cache
    for (const agent of data.agents) {
      this.agents.push(new WasabeeAgent(agent));
    }

    // push into team cache
    teamcache.set(this.id, this);
  }

  static cacheGet(teamID) {
    if (teamcache.has(teamID)) {
      return teamcache.get(teamID);
    }
    return null;
  }

  static async waitGet(teamID, maxAgeSeconds = 10) {
    if (maxAgeSeconds > 0 && teamcache.has(teamID)) {
      const t = teamcache.get(teamID);
      if (t.fetch > Date.now() - 1000 * maxAgeSeconds) {
        console.log("returning team from cache");
        return t;
      }
    }

    try {
      const t = await teamPromise(teamID);
      return new WasabeeTeam(t);
    } catch (e) {
      console.log(e);
    }
    return null;
  }
}
