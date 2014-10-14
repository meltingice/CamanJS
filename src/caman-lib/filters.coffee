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
