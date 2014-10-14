module.exports =
  luminance: (r, g, b) -> (0.299 * r) + (0.587 * g) + (0.114 * b)

  randomRange: (min, max, getFloat = false) ->
    rand = min + (Math.random() * (max - min))
    return if getFloat then rand.toFixed(getFloat) else Math.round(rand)
