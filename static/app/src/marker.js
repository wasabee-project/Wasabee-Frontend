export default class WasabeeMarker {
  constructor() {
    this.ID = "unset";
    this.portalId = "unset";
    this.type = "unset";
    this.comment = null;
    this.state = "pending";
    this.completedBy = null;
    this.assignedTo = null;
    this.order = 0;
  }

  get opOrder() {
    return this.order;
  }

  set opOrder(o) {
    this.order = Number.parseInt(o, 10);
  }

  // because this is how WasabeeOp does it...
  static create(obj) {
    const marker = new WasabeeMarker();
    marker.ID = obj.ID ? obj.ID : "unset";
    marker.portalId = obj.portalId ? obj.portalId : "unset";
    marker.type = obj.type ? obj.type : "unset";
    marker.comment = obj.comment ? obj.comment : null;
    marker.state = obj.state ? obj.state : "pending";
    marker.completedBy = obj.completedBy ? obj.completedBy : null;
    marker.assignedTo = obj.assignedTo ? obj.assignedTo : null;
    marker.order = obj.order ? obj.order : 0;
    return marker;
  }

  // TBD
  get icon() {
    const iconTypes = {
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

    // at some point we are going to get consistent
    var state = this.state;
    if (this.state == "completed") state = "done";

    return (
      window.wasabeewebui.cdnurl +
      "/img/markers/wasabee_markers_" +
      iconTypes[this.type] +
      "_" +
      state +
      ".png"
    );
  }
}
