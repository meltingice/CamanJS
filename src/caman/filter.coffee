module.exports = class Filter
  constructor: (@processFunc) ->
    @context = null
    @pixelData = null
    @loc = 0
    @r = @g = @b = 0
    @a = 255

  setContext: (@context) ->
    @pixelData = @context.pixelData
    @width = @context.width
    @height = @context.height
    
  setPixel: (@loc, @r, @g, @b, @a) ->

  setup: -> #noop
  execute: ->
    @processFunc.call(@)

    @pixelData[@loc]   = @r
    @pixelData[@loc+1] = @g
    @pixelData[@loc+2] = @b
    @pixelData[@loc+3] = @a

  finish: -> # noop

  coordinatesToLocation: (x, y, width) -> (y * width + x) * 4

  locationToCoordinates: (loc, width) ->
    y = Math.floor(loc / (width * 4))
    x = (loc % (width * 4)) / 4

    [x, y]

  # Retrieves the X, Y location of the current pixel. The origin is at the bottom left corner of 
  # the image, like a normal coordinate system.
  locationXY: ->
    y = Math.floor(@loc / (@context.width * 4))
    x = (@loc % (@context.width * 4)) / 4

    [x, y]

  pixelAtLocation: (loc) ->
    [
      @pixelData[loc], 
      @pixelData[loc + 1], 
      @pixelData[loc + 2], 
      @pixelData[loc + 3]
    ]

  # Returns an RGBA object for a pixel whose location is specified in relation to the current 
  # pixel.
  getPixelRelative: (horiz, vert) ->
    newLoc = @loc + (@width * 4 * vert) + (4 * horiz)

    if newLoc > @pixelData.length or newLoc < 0
      return [0, 0, 0, 255]

    @pixelAtLocation(newLoc)

  # The counterpart to getPixelRelative, this updates the value of a pixel whose location is 
  # specified in relation to the current pixel.
  putPixelRelative: (horiz, vert, rgba) ->
    nowLoc = @loc + (@width * 4 * vert) + (4 * horiz)

    return if newLoc > @pixelData.length or newLoc < 0

    @pixelData[newLoc] = rgba.r
    @pixelData[newLoc + 1] = rgba.g
    @pixelData[newLoc + 2] = rgba.b
    @pixelData[newLoc + 3] = rgba.a

    true

  # Gets an RGBA object for an arbitrary pixel in the canvas specified by absolute X, Y coordinates
  getPixel: (x, y) ->
    loc = @coordinatesToLocation(x, y, @width)
    @pixelAtLocation(loc)

  # Updates the pixel at the given X, Y coordinate
  putPixel: (x, y, rgba) ->
    loc = @coordinatesToLocation(x, y, @width)

    @pixelData[loc] = rgba.r
    @pixelData[loc + 1] = rgba.g
    @pixelData[loc + 2] = rgba.b
    @pixelData[loc + 3] = rgba.a
