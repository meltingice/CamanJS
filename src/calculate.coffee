class Calculate
  @distance: (x1, y1, x2, y2) ->
    Math.sqrt Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)

  @randomRange: (min, max, float = false) ->
    rand = min + (Math.random() * (max - min))
    return if float then rand.toFixed(float) else Math.round(rand)