(function (Caman) {

Caman.manip.boxBlur = function () {
  return this.processKernel('Box Blur', [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ]);
};

Caman.manip.radialBlur = function () {
  return this.processKernel('Radial Blur', [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ], 5);
};

Caman.manip.heavyRadialBlur = function () {
  return this.processKernel('Heavy Radial Blur', [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0]
  ], 13);
};

Caman.manip.motionBlur = function (degrees) {
  var kernel;
  
  if (degrees == 0 || degrees == 180) {
    kernel = [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0]
    ];
  } else if ((degrees > 0 && degrees < 90) || (degrees > 180 && degrees < 270)) {
    kernel = [
      [0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0],
      [1, 0, 0, 0, 0]
    ];
  } else if (degrees == 90 || degrees == 270) {
    kernel = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ];
  } else {
    kernel = [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1]
    ];
  }
  
  return this.processKernel('Motion Blur', kernel, 5);
};

Caman.manip.sharpen = function () {
  return this.processKernel('Sharpen', [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ]);
};

}(Caman));