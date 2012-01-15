class PixelInfo
  constructor: (@c) -> @loc = 0

  locationXY: ->
    y = @c.dimensions.height - Math.floor(@loc / (@c.dimensions.width * 4))
    x = (@loc % (@c.dimensions.width * 4)) / 4

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

  putPixelRelative: (horiz, vert, rgba) ->
    nowLoc = @loc + (@c.dimensions.width * 4 * (vert * -1)) + (4 * horiz)

    return if newLoc > @c.pixelData.length or newLoc < 0

    @c.pixelData[newLoc] = rgba.r
    @c.pixelData[newLoc + 1] = rgba.g
    @c.pixelData[newLoc + 2] = rgba.b
    @c.pixelData[newLoc + 3] = rgba.a

    return true

  getPixel: (x, y) ->
    loc = (y * @c.dimensions.width + x) * 4

    return {
      r: @c.pixelData[loc]
      g: @c.pixelData[loc + 1]
      b: @c.pixelData[loc + 2]
      a: @c.pixelData[loc + 3]
    }

  putPixel: (x, y, rgba) ->
    loc = (y * @c.dimensions.width + x) * 4

    @c.pixelData[loc] = rgba.r
    @c.pixelData[loc + 1] = rgba.g
    @c.pixelData[loc + 2] = rgba.b
    @c.pixelData[loc + 3] = rgba.a