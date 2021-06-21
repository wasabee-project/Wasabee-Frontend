export default class WasabeeMarker {
  constructor() {
    this.ID = "unset";
    this.portalId = "unset";
    this.type = "unset";
    this.comment = null;
    this.state = "pending";
    this.completedID = null;
    this.assignedTo = null;
    this.order = 0;
    this.zone = 1;

    this.iconTypes = {
      CapturePortalMarker: "capture",
      LetDecayPortalAlert: "decay",
      ExcludeMarker: "exclude",
      DestroyPortalAlert: "destroy",
      FarmPortalMarker: "farm",
      GotoPortalMarker: "goto",
      GetKeyPortalMarker: "key",
      CreateLinkAlert: "link",
      MeetAgentPortalMarker: "meetagent",
      OtherPortalAlert: "other",
      RechargePortalAlert: "recharge",
      UpgradePortalAlert: "upgrade",
      UseVirusPortalAlert: "virus",
    };
  }

  get opOrder() {
    return this.order;
  }

  set opOrder(o) {
    this.order = Number.parseInt(o, 10);
  }

  get friendlyType() {
    return this.iconTypes[this.type];
  }

  // because this is how WasabeeOp does it...
  static create(obj) {
    const marker = new WasabeeMarker();
    marker.ID = obj.ID ? obj.ID : "unset";
    marker.portalId = obj.portalId ? obj.portalId : "unset";
    marker.type = obj.type ? obj.type : "unset";
    marker.comment = obj.comment ? obj.comment : null;
    marker.state = obj.state ? obj.state : "pending";
    marker.completedID = obj.completedID ? obj.completedID : null;
    marker.assignedTo = obj.assignedTo ? obj.assignedTo : null;
    marker.order = obj.order ? obj.order : 0;
    marker.zone = obj.zone ? obj.zone : 1;
    return marker;
  }

  get completed() {
    return this.state == "completed";
  }

  set completed(value) {
    if (value != this.completed) {
      this.state = value
        ? "completed"
        : this.assignedTo
        ? "assigned"
        : "pending";
    }
  }

  get icon() {
    // at some point we are going to get consistent
    var state = this.state;
    if (this.state == "completed") state = "done";
    if (this.state == "acknowledged") state = "acknowledge";

    return (
      window.wasabeewebui.cdnurl +
      "/img/markers/wasabee_markers_" +
      this.iconTypes[this.type] +
      "_" +
      state +
      ".svg"
    );
  }
}
