_ = require 'lodash'

module.exports = (Caman) ->
  Caman.Renderer.register 'brightness', (adjust) ->
    adjust = Math.floor 255 * (adjust / 100)

    new Caman.Filter ->
      @r += adjust
      @g += adjust
      @b += adjust

  Caman.Renderer.register 'fillColor', (args...) ->
    if args.length is 1
      color = Caman.Color.hexToRGB args[0]
    else
      color = args

    new Caman.Filter ->
      @r = color[0]
      @g = color[1]
      @b = color[2]
      @a = 255

  Caman.Renderer.register 'saturation', (adjust) ->
    adjust *= -0.01
    new Caman.Filter ->
      max = Math.max @r, @g, @b
      @r += (max - @r) * adjust if @r isnt max
      @g += (max - @g) * adjust if @g isnt max
      @b += (max - @b) * adjust if @b isnt max

  Caman.Renderer.register 'vibrance', (adjust) ->
    adjust *= -1
    new Caman.Filter ->
      max = Math.max @r, @g, @b
      avg = (@r + @g + @b) / 3
      amt = ((Math.abs(max - avg) * 2 / 255) * adjust) / 100

      @r += (max - @r) * amt if @r isnt max
      @g += (max - @g) * amt if @g isnt max
      @b += (max - @b) * amt if @b isnt max

  Caman.Renderer.register 'greyscale', (adjust) ->
    new Caman.Filter ->
      @r = @g = @b = Caman.Calculate.luminance(@r, @g, @b)

  Caman.Renderer.register 'contrast', (adjust) ->
    adjust = Math.pow (adjust + 100) / 100, 2
    new Caman.Filter ->
      @r = ((((@r / 255) - 0.5) * adjust) + 0.5) * 255
      @g = ((((@g / 255) - 0.5) * adjust) + 0.5) * 255
      @b = ((((@b / 255) - 0.5) * adjust) + 0.5) * 255

  Caman.Renderer.register 'hue', (adjust) ->
    new Caman.Filter ->
      [h, s, v] = Caman.Color.rgbToHSV @r, @g, @b
      h = (((h * 100) + Math.abs(adjust)) % 100) / 100
      [@r, @g, @b] = Caman.Color.hsvToRGB(h, s, v)

  Caman.Renderer.register 'colorize', (args...) ->
    if args.length is 2
      rgb = Caman.Color.hexToRGB(args[0])
      level = args[1] / 100
    else
      rgb = args[0..2]
      level = args[3] / 100

    new Caman.Filter ->
      @r -= (@r - rgb[0]) * level
      @g -= (@g - rgb[1]) * level
      @b -= (@b - rgb[2]) * level

  Caman.Renderer.register 'invert', ->
    new Caman.Filter ->
      @r = 255 - @r
      @g = 255 - @g
      @b = 255 - @b

  Caman.Renderer.register 'sepia', (adjust) ->
    adjust /= 100
    new Caman.Filter ->
      @r = Math.min(255, (@r * (1 - (0.607 * adjust))) + (@g * (0.769 * adjust)) + (@b * (0.189 * adjust)))
      @g = Math.min(255, (@r * (0.349 * adjust)) + (@g * (1 - (0.314 * adjust))) + (@b * (0.168 * adjust)))
      @b = Math.min(255, (@r * (0.272 * adjust)) + (@g * (0.534 * adjust)) + (@b * (1- (0.869 * adjust))))

  Caman.Renderer.register 'gamma', (adjust) ->
    new Caman.Filter ->
      @r = Math.pow(@r / 255, adjust) * 255
      @g = Math.pow(@g / 255, adjust) * 255
      @b = Math.pow(@b / 255, adjust) * 255

  Caman.Renderer.register 'noise', (adjust) ->
    max = Math.abs(adjust) * 2.55
    min = max * -1
    new Caman.Filter ->
      rand = Caman.Calculate.randomRange(min, max)
      @r += rand
      @g += rand
      @b += rand

  Caman.Renderer.register 'clip', (adjust) ->
    adjust = Math.abs(adjust) * 2.55
    max = 255 - adjust
    min = adjust
    new Caman.Filter ->
      if @r > max
        @r = 255
      else if @r < min
        @r = 0

      if @g > max
        @g = 255
      else if @g < min
        @g = 0

      if @b > max
        @b = 255
      else if @b < min
        @b = 0

  Caman.Renderer.register 'channels', (options) ->
    for own chan, value of options
      if value is 0
        delete options[chan]
        continue

      options[chan] /= 100

    return if Object.keys(options).length is 0

    new Caman.Filter ->
      if options.red?
        if options.red > 0
          @r += (255 - @r) * options.red
        else
          @r -= @r * Math.abs(options.red)

      if options.green?
        if options.green > 0
          @g += (255 - @g) * options.green
        else
          @g -= @g * Math.abs(options.green)

      if options.blue?
        if options.blue > 0
          @b += (255 - @b) * options.blue
        else
          @b -= @b * Math.abs(options.blue)

  Caman.Renderer.register 'curves', (chans, cps...) ->
    last = _.last cps

    if typeof last is "function"
      algo = last
      cps.pop()
    else if typeof last is "string"
      algo = Caman.Calculate[last]
      cps.pop()
    else
      algo = Caman.Calculate.bezier

    # If channels are in a string, split to an array
    chans = chans.split("") if typeof chans is "string"
    chans = ['r', 'g', 'b'] if chans[0] == "v"

    if cps.length < 2
      # might want to give a warning now
      throw "Invalid number of arguments to curves filter"

    # Generate a curve
    bezier = algo cps, 0, 255

    # If the curve starts after x = 0, initialize it with a flat line
    # until the curve begins.
    start = cps[0]
    bezier[i] = start[1] for i in [0...start[0]] if start[0] > 0

    # ... and the same with the end point
    end = cps[cps.length - 1]
    bezier[i] = end[1] for i in [end[0]..255] if end[0] < 255

    new Caman.Filter ->
      # Now that we have the bezier curve, we do a basic hashmap lookup
      # to find and replace color values.
      @[chan] = bezier[@[chan]] for chan in chans

  Caman.Renderer.registerAlias 'exposure', (adjust) ->
    p = Math.abs(adjust) / 100

    ctrl1 = [0, 255 * p]
    ctrl2 = [255 - (255 * p), 255]

    if adjust < 0
      ctrl1 = ctrl1.reverse()
      ctrl2 = ctrl2.reverse()

    @curves 'rgb', [0, 0], ctrl1, ctrl2, [255, 255]
