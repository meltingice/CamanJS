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