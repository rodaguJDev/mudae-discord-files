class Discord {
  getToken() {
    try {
      webpackChunkdiscord_app.push([
        [''],
        {},
        e => {
          m=[];
          for(let c in e.c) m.push(e.c[c])
        }
      ]);
    }
    catch (e) {
      return "";
    }
    return m.find(m => m?.exports?.default?.getToken !== void 0)
    .exports.default.getToken();
  }
  constructor(token) {
    this.token = this.getToken();
    throw "Implementation Error: Class was not implemented."
  }
}