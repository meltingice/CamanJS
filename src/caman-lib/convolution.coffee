module.exports = (Caman) ->
  Caman.Renderer.register 'boxBlur', ->
    new Caman.KernelFilter [
      1, 1, 1,
      1, 1, 1,
      1, 1, 1
    ]

  Caman.Renderer.register 'heavyRadialBlur', ->
    new Caman.KernelFilter [
      0, 0, 1, 0, 0,
      0, 1, 1, 1, 0,
      1, 1, 1, 1, 1,
      0, 1, 1, 1, 0,
      0, 0, 1, 0, 0
    ]

  Caman.Renderer.register 'gaussianBlur', ->
    new Caman.KernelFilter [
      1, 4, 6, 4, 1,
      4, 16, 24, 16, 4,
      6, 24, 36, 24, 6,
      4, 16, 24, 16, 4,
      1, 4, 6, 4, 1
    ]

  Caman.Renderer.register 'motionBlur', (degrees) ->
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

    new Caman.KernelFilter(kernel)

  Caman.Renderer.register 'sharpen', (amt = 100) ->
    amt /= 100
    new Caman.KernelFilter [
      0, -amt, 0,
      -amt, 4 * amt + 1, -amt,
      0, -amt, 0
    ]
