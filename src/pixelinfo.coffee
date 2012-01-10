class PixelInfo
  constructor: (@c) -> @loc = 0

  locationXY: ->
    y = @dimensions.height - Math.floor(@loc / (@dimensions.width * 4))
    x = (@loc % (@dimensions.width * 4)) / 4

    return x: x, y: y