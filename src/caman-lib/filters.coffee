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

