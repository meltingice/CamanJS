Filter.register "brightness", (adjust) ->
  adjust = Math.floor 255 * (adjust / 100)

  @process "brightness", (rgba) ->
    rgba.r += adjust
    rgba.g += adjust
    rgba.b += adjust

    rgba