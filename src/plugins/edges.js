/*global Caman: true, exports: true */

/*
 * NodeJS compatibility
 */
if (!Caman && typeof exports == "object") {
	var Caman = {manip:{}};
	exports.plugins = Caman.manip;
}

(function (Caman) {

Caman.manip.edgeEnhance = function () {
  return this.processKernel('Edge Enhance', [
    [0, 0, 0],
    [-1, 1, 0],
    [0, 0, 0]
  ]);
};

Caman.manip.edgeDetect = function () {
  return this.processKernel('Edge Detect', [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1]
  ]);
};

Caman.manip.emboss = function () {
  return this.processKernel('Emboss', [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2]
  ]);
};

}(Caman));