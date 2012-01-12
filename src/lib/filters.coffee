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

Filter.register "vibrance", (adjust) ->
  adjust *= -1

  @process "vibrance", (rgba) ->
    max = Math.max rgba.r, rgba.g, rgba.b
    avg = (rgba.r + rgba.g + rgba.b) / 3
    amt = ((Math.abs(max - avg) * 2 / 255) * adjust) / 100

    rgba.r += (max - rgba.r) * adjust if rgba.r isnt max
    rgba.g += (max - rgba.g) * adjust if rgba.g isnt max
    rgba.b += (max - rgba.b) * adjust if rgba.b isnt max
    rgba
    
Filter.register "greyscale", (adjust) ->
  @process "greyscale", (rgba) ->
    # Calculate the average value of the 3 color channels 
    # using the special factors
    avg = 0.3 * rgba.r + 0.59 * rgba.g + 0.11 * rgba.b

    rgba.r = avg
    rgba.g = avg
    rgba.b = avg
    rgba

Filter.register "contrast", (adjust) ->
  adjust = Math.pow((adjust + 100) / 100, 2)

  @process "contrast", (rgba) ->
    # Red channel
    rgba.r /= 255;
    rgba.r -= 0.5;
    rgba.r *= adjust;
    rgba.r += 0.5;
    rgba.r *= 255;
    
    # Green channel
    rgba.g /= 255;
    rgba.g -= 0.5;
    rgba.g *= adjust;
    rgba.g += 0.5;
    rgba.g *= 255;
    
    # Blue channel
    rgba.b /= 255;
    rgba.b -= 0.5;
    rgba.b *= adjust;
    rgba.b += 0.5;
    rgba.b *= 255;

    rgba

Filter.register "hue", (adjust) ->
  @process "hue", (rgba) ->
    hsv = Convert.rgbToHSV rgba.r, rgba.g, rgba.b
    
    h = hsv.h * 100
    h += Math.abs adjust
    h = h % 100
    h /= 100
    hsv.h = h

    rgb = Convert.hsvToRGB hsv.h, hsv.s, hsv.v
    rgb.a = rgba.a
    rgb

Filter.register "colorize", ->
  if arguments.length is 2
    rgb = Convert.hexToRGB(arguments[0])
    level = arguments[1]
  else if arguments.length is 4
    rgb =
      r: arguments[0]
      g: arguments[1]
      b: arguments[2]

    level = arguments[3]

  @process "colorize", (rgba) ->
    rgba.r -= (rgba.r - rgb.r) * (level / 100)
    rgba.g -= (rgba.g - rgb.g) * (level / 100)
    rgba.b -= (rgba.b - rgb.b) * (level / 100)
    rgba

Filter.register "invert", ->
  @process "invert", (rgba) ->
    rgba.r = 255 - rgba.r
    rgba.g = 255 - rgba.g
    rgba.b = 255 - rgba.b
    rgba
    
Filter.register "sepia", (adjust = 100) ->
  adjust /= 100

  @process "sepia", (rgba) ->
     # All three color channels have special conversion factors that 
     # define what sepia is. Here we adjust each channel individually, 
     # with the twist that you can partially apply the sepia filter.
    rgba.r = Math.min(255, (rgba.r * (1 - (0.607 * adjust))) + (rgba.g * (0.769 * adjust)) + (rgba.b * (0.189 * adjust)));
    rgba.g = Math.min(255, (rgba.r * (0.349 * adjust)) + (rgba.g * (1 - (0.314 * adjust))) + (rgba.b * (0.168 * adjust)));
    rgba.b = Math.min(255, (rgba.r * (0.272 * adjust)) + (rgba.g * (0.534 * adjust)) + (rgba.b * (1- (0.869 * adjust))));

    rgba

Filter.register "gamma", (adjust) ->
  @process "gamma", (rgba) ->
    rgba.r = Math.pow(rgba.r / 255, adjust) * 255
    rgba.g = Math.pow(rgba.g / 255, adjust) * 255
    rgba.b = Math.pow(rgba.b / 255, adjust) * 255
    rgba

Filter.register "noise", (adjust) ->
  adjust = Math.abs(adjust) * 2.55
  
  @process "noise", (rgba) ->
    rand = Calculate.randomRange adjust * -1, adjust

    rgba.r += rand
    rgba.g += rand
    rgba.b += rand
    rgba

Filter.register "clip", (adjust) ->
  adjust = Math.abs(adjust) * 2.55

  @process "clip", (rgba) ->
    if rgba.r > 255 - adjust
      rgba.r = 255
    else if rgba.r < adjust
      rgba.r = 0

    if rgba.g > 255 - adjust
      rgba.g = 255
    else if rgba.g < adjust
      rgba.g = 0
      
    if rgba.b > 255 - adjust
      rgba.b = 255
    else if rgba.b < adjust
      rgba.b = 0

    rgba

Filter.register "channels", (options) ->
  return @ if typeof options isnt "object"

  for own chan, value of options
    if value is 0
      delete options[chan]
      continue

    options[chan] /= 100

  return @ if options.length is 0

  @process "channels", (rgba) ->
    if options.red?
      if options.red > 0
        rgba.r += (255 - rgba.r) * options.red
      else
        rgba.r -= rgba.r * Math.abs(options.red)

    if options.green?
      if options.green > 0
        rgba.g += (255 - rgba.g) * options.green
      else
        rgba.g -= rgba.g * Math.abs(options.green)

    if options.blue?
      if options.blue > 0
        rgba.b += (255 - rgba.b) * options.blue
      else
        rgba.b -= rgba.b * Math.abs(options.blue)

    rgba

Filter.register "curves", (chans, start, ctrl1, ctrl2, end) ->
  # If channels are in a string, split to an array
  chans = chans.split("") if typeof chans is "string"

  # Generate a bezier curve
  bezier = Calculate.bezier start, ctrl1, ctrl2, end, 0, 255

  # If the curve starts after x = 0, initialize it with a flat line
  # until the curve begins.
  bezier[i] = start[1] for i in [0...start[0]] if start[0] > 0

  # ... and the same with the end point
  bezier[i] = end[1] for i in [end[0]..255] if end[0] < 255

  @process "curves", (rgba) ->
    # Now that we have the bezier curve, we do a basic hashmap lookup
    # to find and replace color values.
    rgba[chans[i]] = bezier[rgba[chans[i]]] for i in [0...chans.length]
    rgba

Filter.register "exposure", (adjust) ->
  p = Math.abs(adjust) / 100

  ctrl1 = [0, 255 * p]
  ctrl2 = [255 - (255 * p), 255]

  if adjust < 0
    ctrl1 = ctrl1.reverse()
    ctrl2 = ctrl2.reverse()

  @curves 'rgb', [0, 0], ctrl1, ctrl2, [255, 255]