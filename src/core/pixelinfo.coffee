class PixelInfo
  constructor: (@c) -> @loc = 0

  locationXY: ->
    y = @dimensions.height - Math.floor(@loc / (@dimensions.width * 4))
    x = (@loc % (@dimensions.width * 4)) / 4

    return x: x, y: y

  getPixelRelative: (horiz, vert) ->
    newLoc = @loc + (@c.dimensions.width * 4 * (vert * -1)) + (4 * horiz)

    if newLoc > @c.pixelData.length or newLoc < 0
      return r: 0, g: 0, b: 0, a: 0

    return {
      r: @c.pixelData[newLoc]
      g: @c.pixelData[newLoc + 1]
      b: @c.pixelData[newLoc + 2]
      a: @c.pixelData[newLoc + 3]
    }