(function (Caman) {

Caman.manip.blur = function () {
  return this.processKernel([
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ], 9);
};

Caman.manip.sharpen = function () {
  return this.processKernel([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ]);
};

}(Caman));