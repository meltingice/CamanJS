Caman.Filter.register "boxBlur", ->
  @processKernel "Box Blur", [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
  ]

Caman.Filter.register "heavyRadialBlur", ->
  @processKernel "Heavy Radial Blur", [
    0, 0, 1, 0, 0,
    0, 1, 1, 1, 0,
    1, 1, 1, 1, 1,
    0, 1, 1, 1, 0,
    0, 0, 1, 0, 0
  ]

Caman.Filter.register "gaussianBlur", ->
  @processKernel "Gaussian Blur", [
    1, 4, 6, 4, 1,
    4, 16, 24, 16, 4,
    6, 24, 36, 24, 6,
    4, 16, 24, 16, 4,
    1, 4, 6, 4, 1
  ]

Caman.Filter.register "motionBlur", (degrees) ->
  if degrees in [0, 180]
    kernel = [
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0
    ]
  else if (degrees > 0 && degrees < 90) || (degrees > 180 && degrees < 270)
    kernel = [
      0, 0, 0, 0, 1,
      0, 0, 0, 1, 0,
      0, 0, 1, 0, 0,
      0, 1, 0, 0, 0,
      1, 0, 0, 0, 0
    ]
  else if degrees in [90, 270]
    kernel = [
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      1, 1, 1, 1, 1,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ]
  else
    kernel = [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
      0, 0, 0, 0, 1
    ]

  @processKernel "Motion Blur", kernel

Caman.Filter.register "sharpen", (amt = 100) ->
  amt /= 100

  @processKernel "Sharpen", [
    0, -amt, 0,
    -amt, 4 * amt + 1, -amt,
    0, -amt, 0
  ]
