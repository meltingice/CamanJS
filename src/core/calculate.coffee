# Various math-heavy helpers that are used throughout CamanJS.
class Caman.Calculate
  # Calculates the distance between two points.

  # @param [Number] x1 1st point x-coordinate.
  # @param [Number] y1 1st point y-coordinate.
  # @param [Number] x2 2nd point x-coordinate.
  # @param [Number] y2 2nd point y-coordinate.
  # @return [Number] The distance between the two points.
  @distance: (x1, y1, x2, y2) ->
    Math.sqrt Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)

  # Generates a pseudorandom number that lies within the max - mix range. The number can be either 
  # an integer or a float depending on what the user specifies.

  # @param [Number] min The lower bound (inclusive).
  # @param [Number] max The upper bound (inclusive).
  # @param [Boolean] getFloat Return a Float or a rounded Integer?
  # @return [Number] The pseudorandom number, either as a float or integer.
  @randomRange: (min, max, getFloat = false) ->
    rand = min + (Math.random() * (max - min))
    return if getFloat then rand.toFixed(getFloat) else Math.round(rand)

  # Calculates the luminance of a single pixel using a special weighted sum.
  # @param [Object] rgba RGBA object describing a single pixel.
  # @return [Number] The luminance value of the pixel.
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
  #
  # @param [Array] 2-item arrays describing the x, y coordinates of the control points. Minimum three.
  # @param [Number] lowBound (optional) Minimum possible value for any y-value in the curve.
  # @param [Number] highBound (optional) Maximum posisble value for any y-value in the curve.
  # @return [Array] Array whose index represents every x-value between start and end, and value
  #   represents the corresponding y-value.
  @bezier: (start, ctrl1, ctrl2, end, lowBound, highBound) ->
    #(controlPoints, lowBound, highBound) ->
    # 4.0 shim - change declaration to (controlPoints, lowBound, highBound) at 5.0
    if start[0] instanceof Array
        controlPoints = start
        lowBound = ctrl1
        highBound = ctrl2
    else
        controlPoints = [start, ctrl1, ctrl2, end]

    if controlPoints.length < 2
        throw "Invalid number of arguments to bezier"

    bezier = {}
    lerp = (a, b, t) -> return a * (1 - t) + b * t
    clamp = (a, min, max) -> return Math.min(Math.max(a, min), max)

    for i in [0...1000]
        t = i / 1000
        prev = controlPoints

        while prev.length > 1
            next = []

            for j in [0..(prev.length - 2)]
                next.push([
                    lerp(prev[j][0], prev[j + 1][0], t),
                    lerp(prev[j][1], prev[j + 1][1], t)
                ])

            prev = next

        bezier[Math.round(prev[0][0])] = Math.round(clamp(prev[0][1], lowBound, highBound))

    end = controlPoints[controlPoints.length - 1]
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

Calculate = Caman.Calculate