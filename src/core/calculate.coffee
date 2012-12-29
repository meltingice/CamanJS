# Various math-heavy helpers
Caman.Calculate = class Calculate
  # Calculates the distance between two points
  @distance: (x1, y1, x2, y2) ->
    Math.sqrt Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)

  # Generates a pseudorandom number that lies within the max - mix range. The number can be either 
  # an integer or a float depending on what the user specifies.
  @randomRange: (min, max, getFloat = false) ->
    rand = min + (Math.random() * (max - min))
    return if getFloat then rand.toFixed(getFloat) else Math.round(rand)

  # Calculates the luminance of a single pixel using a special weighted sum
  @luminance: (rgba) -> (0.299 * rgba.r) + (0.587 * rgba.g) + (0.114 * rgba.b)

  # Generates a bezier curve given a start and end point, with two control points in between.
  # Can also optionally bound the y values between a low and high bound.
  #
  # This is different than most bezier curve functions because it attempts to construct it in such 
  # a way that we can use it more like a simple input -> output system, or a one-to-one function. 
  # In other words we can provide an input color value, and immediately receive an output modified 
  # color value.
  #
  # Note that, by design, this does not force X values to be in the range [0..255]. This is to
  # generalize the function a bit more. If you give it a starting X value that isn't 0, and/or a
  # ending X value that isn't 255, you may run into problems with your filter!
  @bezier: (start, ctrl1, ctrl2, end, lowBound, highBound) ->
    x0 = start[0]
    y0 = start[1]
    x1 = ctrl1[0]
    y1 = ctrl1[1]
    x2 = ctrl2[0]
    y2 = ctrl2[1]
    x3 = end[0]
    y3 = end[1]
    bezier = {}

    # Calculate our X/Y coefficients
    Cx = parseInt(3 * (x1 - x0), 10)
    Bx = 3 * (x2 - x1) - Cx
    Ax = x3 - x0 - Cx - Bx

    Cy = 3 * (y1 - y0)
    By = 3 * (y2 - y1) - Cy
    Ay = y3 - y0 - Cy - By

    # 1000 is actually arbitrary. We need to make sure we do enough
    # calculations between 0 and 255 that, in even the more extreme
    # circumstances, we calculate as many values as possible. In the event
    # that an X value is skipped, it will be found later on using linear
    # interpolation.
    for i in [0...1000]
      t = i / 1000

      curveX = Math.round (Ax * Math.pow(t, 3)) + (Bx * Math.pow(t, 2)) + (Cx * t) + x0
      curveY = Math.round (Ay * Math.pow(t, 3)) + (By * Math.pow(t, 2)) + (Cy * t) + y0

      if lowBound and curveY < lowBound
        curveY = lowBound
      else if highBound and curveY > highBound
        curveY = highBound

      bezier[curveX] = curveY

    # Do a search for missing values in the bezier array and use linear
    # interpolation to approximate their values
    if bezier.length < end[0] + 1
      for i in [0..end[0]]
        if not bezier[i]?
          leftCoord = [i-1, bezier[i-1]]

          # Find the first value to the right. Ideally this loop will break
          # very quickly.
          for j in [i..end[0]]
            if bezier[j]?
              rightCoord = [j, bezier[j]]
              break

          bezier[i] = leftCoord[1] + 
            ((rightCoord[1] - leftCoord[1]) / (rightCoord[0] - leftCoord[0])) * 
            (i - leftCoord[0])

    # Edge case
    bezier[end[0]] = bezier[end[0] - 1] if not bezier[end[0]]?
    
    return bezier
      