Caman.Filter.register "vintage", (vignette = true) ->
  @greyscale()
  @contrast 5
  @noise 3
  @sepia 100
  @channels red: 8, blue: 2, green: 4
  @gamma 0.87

  @vignette("40%", 30) if vignette

Caman.Filter.register "lomo", (vignette = true) ->
  @brightness 15
  @exposure 15
  @curves 'rgb', [0, 0], [200, 0], [155, 255], [255, 255]
  @saturation -20
  @gamma 1.8
  @vignette("50%", 60) if vignette
  @brightness 5

Caman.Filter.register "clarity", (grey = false) ->
  @vibrance 20
  @curves 'rgb', [5, 0], [130, 150], [190, 220], [250, 255]
  @sharpen 15
  @vignette "45%", 20

  if grey
    @greyscale()
    @contrast 4

  @

Caman.Filter.register "sinCity", ->
  @contrast 100
  @brightness 15
  @exposure 10
  @posterize 80
  @clip 30
  @greyscale()

Caman.Filter.register "sunrise", ->
  @exposure 3.5
  @saturation -5
  @vibrance 50
  @sepia 60
  @colorize "#e87b22", 10
  @channels red: 8, blue: 8
  @contrast 5
  @gamma 1.2
  @vignette "55%", 25

Caman.Filter.register "crossProcess", ->
  @exposure 5
  @colorize "#e87b22", 4
  @sepia 20
  @channels blue: 8, red: 3
  @curves 'b', [0, 0], [100, 150], [180, 180], [255, 255]
  @contrast 15
  @vibrance 75
  @gamma 1.6

Caman.Filter.register "orangePeel", ->
  @curves 'rgb', [0, 0], [100, 50], [140, 200], [255, 255]
  @vibrance -30
  @saturation -30
  @colorize '#ff9000', 30
  @contrast -5
  @gamma 1.4

Caman.Filter.register "love", ->
  @brightness 5
  @exposure 8
  @contrast 4
  @colorize '#c42007', 30
  @vibrance 50
  @gamma 1.3

Caman.Filter.register "grungy", ->
  @gamma 1.5
  @clip 25
  @saturation -60
  @contrast 5
  @noise 5
  @vignette "50%", 30

Caman.Filter.register "jarques", ->
  @saturation -35
  @curves 'b', [20, 0], [90, 120], [186, 144], [255, 230]
  @curves 'r', [0, 0], [144, 90], [138, 120], [255, 255]
  @curves 'g', [10, 0], [115, 105], [148, 100], [255, 248]
  @curves 'rgb', [0, 0], [120, 100], [128, 140], [255, 255]
  @sharpen 20

Caman.Filter.register "pinhole", ->
  @greyscale()
  @sepia 10
  @exposure 10
  @contrast 15
  @vignette "60%", 35

Caman.Filter.register "oldBoot", ->
  @saturation -20
  @vibrance -50
  @gamma 1.1
  @sepia 30
  @channels red: -10, blue: 5
  @curves 'rgb', [0, 0], [80, 50], [128, 230], [255, 255]
  @vignette "60%", 30

Caman.Filter.register "glowingSun", (vignette = true) ->
  @brightness 10

  @newLayer ->
    @setBlendingMode "multiply"
    @opacity 80
    @copyParent()

    @filter.gamma 0.8
    @filter.contrast 50
    @filter.exposure 10

  @newLayer ->
    @setBlendingMode "softLight"
    @opacity 80
    @fillColor "#f49600"

  @exposure 20
  @gamma 0.8
  @vignette "45%", 20 if vignette

Caman.Filter.register "hazyDays", ->
  @gamma 1.2

  @newLayer ->
    @setBlendingMode "overlay"
    @opacity 60
    @copyParent()

    @filter.channels red: 5
    @filter.stackBlur 15

  @newLayer ->
    @setBlendingMode "addition"
    @opacity 40
    @fillColor "#6899ba"

  @newLayer ->
    @setBlendingMode "multiply"
    @opacity 35
    @copyParent()

    @filter.brightness 40
    @filter.vibrance 40
    @filter.exposure 30
    @filter.contrast 15

    @filter.curves 'r', [0, 40], [128, 128], [128, 128], [255, 215]
    @filter.curves 'g', [0, 40], [128, 128], [128, 128], [255, 215]
    @filter.curves 'b', [0, 40], [128, 128], [128, 128], [255, 215]

    @filter.stackBlur 5

  @curves 'r', [20, 0], [128, 158], [128, 128], [235, 255]
  @curves 'g', [20, 0], [128, 128], [128, 128], [235, 255]
  @curves 'b', [20, 0], [128, 108], [128, 128], [235, 255]

  @vignette "45%", 20

Caman.Filter.register "herMajesty", ->
  @brightness 40
  @colorize "#ea1c5d", 10
  @curves 'b', [0, 10], [128, 180], [190, 190], [255, 255]

  @newLayer ->
    @setBlendingMode 'overlay'
    @opacity 50
    @copyParent()

    @filter.gamma 0.7
    @newLayer ->
      @setBlendingMode 'normal'
      @opacity 60
      @fillColor '#ea1c5d'

  @newLayer ->
    @setBlendingMode 'multiply'
    @opacity 60
    @copyParent()

    @filter.saturation 50
    @filter.hue 90
    @filter.contrast 10

  @gamma 1.4
  @vibrance -30

  @newLayer ->
    @opacity 10
    @fillColor '#e5f0ff'

  @

Caman.Filter.register "nostalgia", ->
  @saturation 20
  @gamma 1.4
  @greyscale()
  @contrast 5
  @sepia 100
  @channels red: 8, blue: 2, green: 4
  @gamma 0.8
  @contrast 5
  @exposure 10

  @newLayer ->
    @setBlendingMode 'overlay'
    @copyParent()
    @opacity 55

    @filter.stackBlur 10

  @vignette "50%", 30

Caman.Filter.register "hemingway", ->
  @greyscale()
  @contrast 10
  @gamma 0.9

  @newLayer ->
    @setBlendingMode "multiply"
    @opacity 40
    @copyParent()

    @filter.exposure 15
    @filter.contrast 15
    @filter.channels green: 10, red: 5

  @sepia 30
  @curves 'rgb', [0, 10], [120, 90], [180, 200], [235, 255]
  @channels red: 5, green: -2
  @exposure 15

Caman.Filter.register "concentrate", ->
  @sharpen 40
  @saturation -50
  @channels red: 3

  @newLayer ->
    @setBlendingMode "multiply"
    @opacity 80
    @copyParent()

    @filter.sharpen 5
    @filter.contrast 50
    @filter.exposure 10
    @filter.channels blue: 5

  @brightness 10