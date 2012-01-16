Caman.Filter.register "posterize", (adjust) ->
  numOfAreas = 256 / adjust
  numOfValues = 255 / (adjust - 1)

  @process "posterize", (rgba) ->
    rgba.r = Math.floor Math.floor(rgba.r / numOfAreas) * numOfValues
    rgba.g = Math.floor Math.floor(rgba.g / numOfAreas) * numOfValues
    rgba.b = Math.floor Math.floor(rgba.b / numOfAreas) * numOfValues
    rgba