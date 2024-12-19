# Represents a single Pixel in an image.
class Caman.Pixel
  @coordinatesToLocation: (x, y, width) ->
    (y * width + x) * 4

  @locationToCoordinates: (loc, width) ->
    y = Math.floor(loc / (width * 4))
    x = (loc % (width * 4)) / 4

    return x: x, y: y

  constructor: (@r = 0, @g = 0, @b = 0, @a = 255, @c = null) ->
    @loc = 0

  setContext: (c) -> @c = c

  # Retrieves the X, Y location of the current pixel. The origin is at the bottom left corner of 
  # the image, like a normal coordinate system.
  locationXY: ->
    throw "Requires a CamanJS context" unless @c?

    y = @c.dimensions.height - Math.floor(@loc / (@c.dimensions.width * 4))
    x = (@loc % (@c.dimensions.width * 4)) / 4

    return x: x, y: y

  pixelAtLocation: (loc) ->
    throw "Requires a CamanJS context" unless @c?

    new Pixel(
      @c.pixelData[loc], 
      @c.pixelData[loc + 1], 
      @c.pixelData[loc + 2], 
      @c.pixelData[loc + 3],
      @c
    )

  # Returns an RGBA object for a pixel whose location is specified in relation to the current 
  # pixel.
  getPixelRelative: (horiz, vert) ->
    throw "Requires a CamanJS context" unless @c?

    # We invert the vert_offset in order to make the coordinate system non-inverted. In laymans
    # terms: -1 means down and +1 means up.
    newLoc = @loc + (@c.dimensions.width * 4 * (vert * -1)) + (4 * horiz)

    if newLoc > @c.pixelData.length or newLoc < 0
      return new Pixel(0, 0, 0, 255, @c)

    return @pixelAtLocation(newLoc)

  # The counterpart to getPixelRelative, this updates the value of a pixel whose location is 
  # specified in relation to the current pixel.
  putPixelRelative: (horiz, vert, rgba) ->
    throw "Requires a CamanJS context" unless @c?

    nowLoc = @loc + (@c.dimensions.width * 4 * (vert * -1)) + (4 * horiz)

    return if newLoc > @c.pixelData.length or newLoc < 0

    @c.pixelData[newLoc] = rgba.r
    @c.pixelData[newLoc + 1] = rgba.g
    @c.pixelData[newLoc + 2] = rgba.b
    @c.pixelData[newLoc + 3] = rgba.a

    return true

  # Gets an RGBA object for an arbitrary pixel in the canvas specified by absolute X, Y coordinates
  getPixel: (x, y) ->
    throw "Requires a CamanJS context" unless @c?

    loc = @coordinatesToLocation(x, y, @width)
    return @pixelAtLocation(loc)

  # Updates the pixel at the given X, Y coordinate
  putPixel: (x, y, rgba) ->
    throw "Requires a CamanJS context" unless @c?

    loc = @coordinatesToLocation(x, y, @width)

    @c.pixelData[loc] = rgba.r
    @c.pixelData[loc + 1] = rgba.g
    @c.pixelData[loc + 2] = rgba.b
    @c.pixelData[loc + 3] = rgba.a

  toString: -> @toKey()
  toHex: (includeAlpha = false) ->
    hex = '#' + 
      @r.toString(16) +
      @g.toString(16) +
      @b.toString(16)

    if includeAlpha then hex + @a.toString(16) else hex

Pixel = Caman.Pixel