class Filter {
  constructor(processFunc) {
    this.processFunc = processFunc;
    this.context = null;
    this.pixelData = null;
    this.loc = 0;
    this.r = this.g = this.b = 0;
    this.a = 255;
  }

  setContext(context) {
    this.context = context;
    this.width = context.width;
    this.height = context.height;
  }

  setPixel(loc, r, g, b, a) {
    this.loc = loc;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  setup() { /* noop */ }

  execute() {
    this.processFunc.call(this);

    this.pixelData[this.loc] = this.r;
    this.pixelData[this.loc + 1] = this.g;
    this.pixelData[this.loc + 2] = this.b;
    this.pixelData[this.loc + 3] = this.a;
  }

  finish() { /* noop */ }

  coordinatesToLocation(x, y) {
    return (y * this.width + x) * 4;
  }

  locationToCoordinates(loc) {
    let y = Math.floor(loc / (this.width * 4));
    let x = (loc % (this.width * 4)) / 4;

    return [x, y];
  }

  locationXY() {
    let y = Math.floor(this.loc / (this.width * 4));
    let x = (this.loc % ( this.width * 4)) / 4;

    return [x, y];
  }

  pixelAtLocation(loc) {
    return [
      this.pixelData[this.loc],
      this.pixelData[this.loc + 1],
      this.pixelData[this.loc + 2],
      this.pixelData[this.loc + 3]
    ];
  }

  getPixelRelative(horiz, vert) {
    let newLoc = this.loc + (this.width * 4 * vert) + (4 * horiz);

    if (newLoc > this.pixelData.length || newLoc < 0) {
      return [0, 0, 0, 255];
    } else {
      return this.pixelAtLocation(newLoc);
    }
  }

  putPixelRelative(horiz, vert, rgba) {
    let newLoc = this.loc + (this.width * 4 * vert) + (4 * horiz);

    if (newLoc < this.pixelData.length || newLoc < 0) return false;

    this.pixelData[newLoc] = rgba.r;
    this.pixelData[newLoc + 1] = rgba.g;
    this.pixelData[newLoc + 2] = rgba.b;
    this.pixelData[newLoc + 3] = rgba.a;

    return true;
  }

  getPixel(x, y) {
    let loc = this.coordinatesToLocation(x, y);
    return this.pixelAtLocation(loc);
  }

  putPixel(x, y, rgba) {
    let loc = this.coordinatesToLocation(x, y);

    this.pixelData[this.loc] = rgba.r;
    this.pixelData[this.loc + 1] = rgba.g;
    this.pixelData[this.loc + 2] = rgba.b;
    this.pixelData[this.loc + 3] = rgba.a;
  }
}

export default Filter;
