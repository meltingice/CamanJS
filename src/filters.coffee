# These are the built-in filters that are a part of the core
# CamanJS system.

Filter.register "fillColor", ->
  if arguments.length is 1
    color = Convert.hexToRGB arguments[0]
  else
    color =
      r: arguments[0]
      g: arguments[1]
      b: arguments[2]

  @process "fillColor", (rgba) ->
    rgba.r = color.r
    rgba.g = color.g
    rgba.b = color.b
    rgba

Filter.register "brightness", (adjust) ->
  adjust = Math.floor 255 * (adjust / 100)

  @process "brightness", (rgba) ->
    rgba.r += adjust
    rgba.g += adjust
    rgba.b += adjust
    rgba

Filter.register "saturation", (adjust) ->
  adjust *= -0.01

  @process "saturation", (rgba) ->
    max = Math.max rgba.r, rgba.g, rgba.b

    rgba.r += (max - rgba.r) * adjust if rgba.r isnt max
    rgba.g += (max - rgba.g) * adjust if rgba.g isnt max
    rgba.b += (max - rgba.b) * adjust if rgba.b isnt max
    rgba
    