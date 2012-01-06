// The pixelInfo object. This object is available inside of the
// process() loop, and it lets filter developers have simple access
// to any arbitrary pixel in the image, as well as information about
// the current pixel in the loop.

/*global Caman: true */ 
(function (Caman) {

// Allows the currently rendering filter to get data about
// surrounding pixels relative to the pixel currently being
// processed. The data returned is identical in format to the
// rgba object provided in the process function.
//
// Example: to get data about the pixel to the top-right
// of the currently processing pixel, you can call (within the process
// function):
// <pre>this.getPixelRelative(1, -1);</pre>
Caman.manip.pixelInfo = function (self) {
  this.loc = 0;
  this.manip = self;
};

// Retrieves the X, Y location of the current pixel. The origin is at the bottom left
// corner of the image, like a normal coordinate system.
Caman.manip.pixelInfo.prototype.locationXY = function () {
  var x, y;
  
  // This was a serious pain in the ass to get right. Since the pixel array is a simple
  // 1-dimensional array (and for good reason) we have to do some math-y magic to calculate
  // our current X, Y position.
  y = this.manip.dimensions.height - Math.floor(this.loc / (this.manip.dimensions.width * 4));
  x = ((this.loc % (this.manip.dimensions.width * 4)) / 4);
  
  return {x: x, y: y};
};

// Returns an RGBA object for a pixel whose location is specified in relation to the current pixel.
Caman.manip.pixelInfo.prototype.getPixelRelative = function (horiz_offset, vert_offset) {
  // We invert the vert_offset in order to make the coordinate system non-inverted. In laymans
  // terms: -1 means down and +1 means up.
  var newLoc = this.loc + (this.manip.dimensions.width * 4 * (vert_offset * -1)) + (4 * horiz_offset);
  
  // Error handling
  if (newLoc > this.manip.pixel_data.length || newLoc < 0) {
    return {r: 0, g: 0, b: 0, a: 0};
  }
  
  return {
    r: this.manip.pixel_data[newLoc],
    g: this.manip.pixel_data[newLoc+1],
    b: this.manip.pixel_data[newLoc+2],
    a: this.manip.pixel_data[newLoc+3]
  };
};

// The counterpart to getPixelRelative, this updates the value of a pixel whose location is specified in
// relation to the current pixel.
Caman.manip.pixelInfo.prototype.putPixelRelative = function (horiz_offset, vert_offset, rgba) {
  var newLoc = this.loc + (this.manip.dimensions.width * 4 * (vert_offset * -1)) + (4 * horiz_offset);
  
  // Error handling
  if (newLoc > this.manip.pixel_data.length || newLoc < 0) {
    return false;
  }
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] = rgba.a;
};

// Gets an RGBA object for an arbitrary pixel in the canvas specified by absolute X, Y coordinates
Caman.manip.pixelInfo.prototype.getPixel = function (x, y) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  return {
    r: this.manip.pixel_data[newLoc],
    g: this.manip.pixel_data[newLoc+1],
    b: this.manip.pixel_data[newLoc+2],
    a: this.manip.pixel_data[newLoc+3]
  };
};

// Updates the pixel at the given X, Y coordinates  
Caman.manip.pixelInfo.prototype.putPixel = function (x, y, rgba) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] = rgba.a;
};

}(Caman));