# The filters define all of the built-in functionality that comes with Caman (as opposed to being 
# provided by a plugin). All of these filters are ratherbasic, but are extremely powerful when
# many are combined. For information on creating plugins, check out the 
# [Plugin Creation](http://camanjs.com/docs/plugin-creation) page, and for information on using 
# the plugins, check out the [Built-In Functionality](http://camanjs.com/docs/built-in) page.

# ## Fill Color
# Fills the canvas with a single solid color.
# 
# ### Arguments
# Can take either separate R, G, and B values as arguments, or a single hex color value.
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
    rgba.a = 255
    rgba

# ## Brightness
# Simple brightness adjustment
#
# ### Arguments
# Range is -100 to 100. Values < 0 will darken image while values > 0 will brighten.
Filter.register "brightness", (adjust) ->
  adjust = Math.floor 255 * (adjust / 100)

  @process "brightness", (rgba) ->
    rgba.r += adjust
    rgba.g += adjust
    rgba.b += adjust
    rgba

# ## Saturation
# Adjusts the color saturation of the image.
#
# ### Arguments
# Range is -100 to 100. Values < 0 will desaturate the image while values > 0 will saturate it.
# **If you want to completely desaturate the image**, using the greyscale filter is highly 
# recommended because it will yield better results.
Filter.register "saturation", (adjust) ->
  adjust *= -0.01

  @process "saturation", (rgba) ->
    max = Math.max rgba.r, rgba.g, rgba.b

    rgba.r += (max - rgba.r) * adjust if rgba.r isnt max
    rgba.g += (max - rgba.g) * adjust if rgba.g isnt max
    rgba.b += (max - rgba.b) * adjust if rgba.b isnt max
    rgba

# ## Vibrance
# Similar to saturation, but adjusts the saturation levels in a slightly smarter, more subtle way. 
# Vibrance will attempt to boost colors that are less saturated more and boost already saturated
# colors less, while saturation boosts all colors by the same level.
#
# ### Arguments
# Range is -100 to 100. Values < 0 will desaturate the image while values > 0 will saturate it.
# **If you want to completely desaturate the image**, using the greyscale filter is highly 
# recommended because it will yield better results.
Filter.register "vibrance", (adjust) ->
  adjust *= -1

  @process "vibrance", (rgba) ->
    max = Math.max rgba.r, rgba.g, rgba.b
    avg = (rgba.r + rgba.g + rgba.b) / 3
    amt = ((Math.abs(max - avg) * 2 / 255) * adjust) / 100

    rgba.r += (max - rgba.r) * amt if rgba.r isnt max
    rgba.g += (max - rgba.g) * amt if rgba.g isnt max
    rgba.b += (max - rgba.b) * amt if rgba.b isnt max
    rgba
    
# ## Greyscale
# An improved greyscale function that should make prettier results
# than simply using the saturation filter to remove color. It does so by using factors
# that directly relate to how the human eye perceves color and values. There are
# no arguments, it simply makes the image greyscale with no in-between.
#
# Algorithm adopted from http://www.phpied.com/image-fun/
Filter.register "greyscale", (adjust) ->
  @process "greyscale", (rgba) ->
    # Calculate the average value of the 3 color channels 
    # using the special factors
    avg = Calculate.luminance(rgba)

    rgba.r = avg
    rgba.g = avg
    rgba.b = avg
    rgba

# ## Contrast
# Increases or decreases the color contrast of the image.
#
# ### Arguments
# Range is -100 to 100. Values < 0 will decrease contrast while values > 0 will increase contrast.
# The contrast adjustment values are a bit sensitive. While unrestricted, sane adjustment values 
# are usually around 5-10.
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

# ## Hue
# Adjusts the hue of the image. It can be used to shift the colors in an image in a uniform 
# fashion. If you are unfamiliar with Hue, I recommend reading this 
# [Wikipedia article](http://en.wikipedia.org/wiki/Hue).
#
# ### Arguments
# Range is 0 to 100
# Sometimes, Hue is expressed in the range of 0 to 360. If that's the terminology you're used to, 
# think of 0 to 100 representing the percentage of Hue shift in the 0 to 360 range.
Filter.register "hue", (adjust) ->
  @process "hue", (rgba) ->
    hsv = Convert.rgbToHSV rgba.r, rgba.g, rgba.b
    
    h = hsv.h * 100
    h += Math.abs adjust
    h = h % 100
    h /= 100
    hsv.h = h

    {r, g, b} = Convert.hsvToRGB hsv.h, hsv.s, hsv.v
    rgba.r = r; rgba.g = g; rgba.b = b
    rgba

# ## Colorize
# Uniformly shifts the colors in an image towards the given color. The adjustment range is from 0 
# to 100. The higher the value, the closer the colors in the image shift towards the given 
# adjustment color.
#
# ### Arguments
# This filter is polymorphic and can take two different sets of arguments. Either a hex color 
# string and an adjustment value, or RGB colors and an adjustment value.
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

# ## Invert
# Inverts all colors in the image by subtracting each color channel value from 255. No arguments.
Filter.register "invert", ->
  @process "invert", (rgba) ->
    rgba.r = 255 - rgba.r
    rgba.g = 255 - rgba.g
    rgba.b = 255 - rgba.b
    rgba
    
# ## Sepia
# Applies an adjustable sepia filter to the image.
#
# ### Arguments
# Assumes adjustment is between 0 and 100, which represents how much the sepia filter is applied.
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

# ## Gamma
# Adjusts the gamma of the image.
#
# ### Arguments
# Range is from 0 to infinity, although sane values are from 0 to 4 or 5.
# Values between 0 and 1 will lessen the contrast while values greater than 1 will increase it.
Filter.register "gamma", (adjust) ->
  @process "gamma", (rgba) ->
    rgba.r = Math.pow(rgba.r / 255, adjust) * 255
    rgba.g = Math.pow(rgba.g / 255, adjust) * 255
    rgba.b = Math.pow(rgba.b / 255, adjust) * 255
    rgba

# ## Noise
# Adds noise to the image on a scale from 1 - 100. However, the scale isn't constrained, so you 
# can specify a value > 100 if you want a LOT of noise.
Filter.register "noise", (adjust) ->
  adjust = Math.abs(adjust) * 2.55
  
  @process "noise", (rgba) ->
    rand = Calculate.randomRange adjust * -1, adjust

    rgba.r += rand
    rgba.g += rand
    rgba.b += rand
    rgba

# ## Clip
# Clips a color to max values when it falls outside of the specified range.
#
# ### Arguments
# Supplied value should be between 0 and 100.
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

# ## Channels
# Lets you modify the intensity of any combination of red, green, or blue channels individually.
#
# ### Arguments
# Must be given at least one color channel to adjust in order to work.
# Options format (must specify 1 - 3 colors):
# <pre>{
#   red: 20,
#   green: -5,
#   blue: -40
# }</pre>
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

# ## Curves
# Curves implementation using Bezier curve equation. If you're familiar with the Curves 
# functionality in Photoshop, this works in a very similar fashion.
#
# ### Arguments.
# <pre>
#   chan - [r, g, b, rgb]
#   cps - [x, y]* (curve control points, min. 2; 0 - 255)
#   algo - function (optional)
# </pre>
#
# The first argument represents the channels you wish to modify with the filter. It can be an 
# array of channels or a string (for a single channel). The rest of the arguments are 2-element 
# arrays that represent point coordinates. They are specified in the same order as shown in this 
# image to the right. The coordinates are in the range of 0 to 255 for both X and Y values.
#
# It is possible to pass the function an optional function describing which curve algorithm to use.
# It defaults to bezier.
#
# The x-axis represents the input value for a single channel, while the y-axis represents the 
# output value.
Filter.register "curves", (chans, cps...) ->
  last = cps[cps.length - 1]

  if typeof last is "function"
    algo = last
    cps.pop()
  else if typeof last is "string"
    algo = Calculate[last]
    cps.pop()
  else
    algo = Calculate.bezier

  # If channels are in a string, split to an array
  chans = chans.split("") if typeof chans is "string"
  chans = ['r', 'g', 'b'] if chans[0] == "v"

  if cps.length < 2
    # might want to give a warning now
    throw "Invalid number of arguments to curves filter"

  # Generate a curve
  bezier = algo cps, 0, 255

  # If the curve starts after x = 0, initialize it with a flat line
  # until the curve begins.
  start = cps[0]
  bezier[i] = start[1] for i in [0...start[0]] if start[0] > 0

  # ... and the same with the end point
  end = cps[cps.length - 1]
  bezier[i] = end[1] for i in [end[0]..255] if end[0] < 255

  @process "curves", (rgba) ->
    # Now that we have the bezier curve, we do a basic hashmap lookup
    # to find and replace color values.
    rgba[chans[i]] = bezier[rgba[chans[i]]] for i in [0...chans.length]
    rgba

# ## Exposure
# Adjusts the exposure of the image by using the curves function.
#
# ### Arguments
# Range is -100 to 100. Values < 0 will decrease exposure while values > 0 will increase exposure.
Filter.register "exposure", (adjust) ->
  p = Math.abs(adjust) / 100

  ctrl1 = [0, 255 * p]
  ctrl2 = [255 - (255 * p), 255]

  if adjust < 0
    ctrl1 = ctrl1.reverse()
    ctrl2 = ctrl2.reverse()

  @curves 'rgb', [0, 0], ctrl1, ctrl2, [255, 255]
