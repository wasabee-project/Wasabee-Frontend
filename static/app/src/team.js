import WasabeeAgent from "./agent";

// simple cache that reset on page reload
const teamCache = new Map();

export default class WasabeeTeam {
  constructor() {
    this.name = null;
    this.id = null;
    this.agents = [];
    this.fetched = null;
    this.jst = null;
    this.rc = null;
    this.rk = null;
  }

  static create(data) {
    // all consumers curently send JSON, but for API consistency
    // support both obj and JSON
    if (typeof data == "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log("corrupted team");
        return null;
      }
    }

    const team = new WasabeeTeam();
    team.id = data.id;
    team.name = data.name;
    team.rc = data.rc;
    team.rk = data.rk;
    team.jlt = data.jlt;
    team.fetched = Date.now();
    for (const agent of data.agents) {
      team.agents.push(WasabeeAgent.create(agent));
    }

    // add to local cache
    teamCache.set(team.id, team);

    return team;
  }

  static get(id) {
    if (teamCache.has(id)) return teamCache.get(id);
    return null;
  }

  getAgent(id) {
    for (const agent of this.agents) {
      if (agent.id == id) return agent;
    }
    return null;
  }
}
