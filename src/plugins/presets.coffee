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