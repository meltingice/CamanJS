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
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0]
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