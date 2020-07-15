export default class WasabeePortal {
  constructor(id, name, lat, lng, comment, hardness) {
    this.id = id;
    // migration: don't use a locale dependent name
    if (name.includes(id)) name = id;
    this.name = name;

    // check window.portals[id].options.data for updated name ?
    if (typeof lat == "number") {
      this.lat = lat.toFixed(6);
    } else {
      this.lat = lat;
    }
    if (typeof lng == "number") {
      this.lng = lng.toFixed(6);
    } else {
      this.lng = lng;
    }
    this.comment = comment;
    this.hardness = hardness;
  }

  // build object to serialize
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      lat: this.lat,
      lng: this.lng,
      comment: this.comment,
      hardness: this.hardness,
    };
  }

  static create(obj) {
    if (typeof obj == "string") obj = JSON.parse(obj);
    if (!obj || !obj.id) {
      console.log("can't create WasabeePortal from this");
      return;
    }
    const wp = new WasabeePortal(
      obj.id,
      obj.name,
      obj.lat,
      obj.lng,
      obj.comment,
      obj.hardness
    );

    return wp;
  }

  // create a wasabee portal from a IITC portal (leaflet marker)
  static fromIITC(p) {
    // we have all the details
    if (p && p.options && p.options.data && p.options.guid) {
      const data = p.options.data;
      const id = p.options.guid;
      if (data.title) {
        return new WasabeePortal(
          id,
          data.title,
          (data.latE6 / 1e6).toFixed(6),
          (data.lngE6 / 1e6).toFixed(6)
        );
      }
      // do we have enough to fake it?
      if (data.latE6) {
        return WasabeePortal.fake(
          (data.latE6 / 1e6).toFixed(6),
          (data.lngE6 / 1e6).toFixed(6),
          id
        );
      }
    }
    // nothing to get
    return null;
  }

  get latLng() {
    return new L.LatLng(parseFloat(this.lat), parseFloat(this.lng));
  }

  // easy compat with IITC's format -- just here for safety as we use more WP
  get _latlng() {
    console.log("calling WasabeePortal._latlng() compat");
    return new L.LatLng(parseFloat(this.lat), parseFloat(this.lng));
  }

  get team() {
    if (window.portals[this.id] && window.portals[this.id].options.data)
      return window.portals[this.id].options.data.team;
    return "";
  }

  get displayName() {
    return this.name;
  }

  displayFormat() {
    return "TBD displayFormat";
  }

  static get(id) {
    return WasabeePortal.fromIITC(window.portals[id]);
  }

  static fake(lat, lng, id, name) {
    if (!lat && !lng) {
      console.log("WasabeePortal.fake called w/o lat/lng");
      return null;
    }

    if (!id) id = "fake";
    if (!name) name = id;
    const n = new WasabeePortal(id, name, lat, lng);
    return n;
  }

  get faked() {
    return this.id.length != 35 || this.id == this.name;
  }

  get loading() {
    return this.id.length == 35 && this.id == this.name;
  }

  get pureFaked() {
    return this.id.length != 35;
  }

  static getSelected() {
    return window.selectedPortal
      ? WasabeePortal.get(window.selectedPortal)
      : null;
  }
}
