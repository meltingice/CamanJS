module.exports = (Caman) ->
  Caman.Renderer.filter 'brightness', (adjust) ->
    adjust = Math.floor 255 * (adjust / 100)

    new Caman.Filter ->
      @r += adjust
      @g += adjust
      @b += adjust
