class Analyze
  constructor: (@c) ->

  calculateLevels: ->
    levels =
      r: {}
      g: {}
      b: {}

    # Initialize all values to 0 first so there are no data gaps
    for i in [0..255]
      levels.r[i] = 0
      levels.g[i] = 0
      levels.b[i] = 0

    # Iterate through each pixel block and increment the level counters
    for i in [0...@c.pixelData.length] by 4
      levels.r[@c.pixelData[i]]++
      levels.g[@c.pixelData[i+1]]++
      levels.b[@c.pixelData[i+2]]++

    # Normalize all of the numbers by converting them to percentages between
    # 0 and 1.0
    numPixels = @c.pixelData.length / 4

    for i in [0..255]
      levels.r[i] /= numPixels
      levels.g[i] /= numPixels
      levels.b[i] /= numPixels

    levels