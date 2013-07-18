# Tons of color conversion utility functions.
class Caman.Convert
  # Converts the hex representation of a color to RGB values.
  # Hex value can optionally start with the hash (#).
  #
  # @param  [String] hex  The colors hex value
  # @return [Array]       The RGB representation
  @hexToRGB: (hex) ->
    hex = hex.substr(1) if hex.charAt(0) is "#"
    r = parseInt hex.substr(0, 2), 16
    g = parseInt hex.substr(2, 2), 16
    b = parseInt hex.substr(4, 2), 16

    r: r, g: g, b: b

  # Converts an RGB color to HSL.
  # Assumes r, g, and b are in the set [0, 255] and
  # returns h, s, and l in the set [0, 1].
  #
  # @overload rgbToHSL(r, g, b)
  #   @param   [Number]  r   Red channel
  #   @param   [Number]  g   Green channel
  #   @param   [Number]  b   Blue channel
  #
  # @overload rgbToHSL(rgb)
  #   @param [Object] rgb The RGB object.
  #   @option rgb [Number] r The red channel.
  #   @option rgb [Number] g The green channel.
  #   @option rgb [Number] b The blue channel.
  #
  # @return  [Array]       The HSL representation
  @rgbToHSL: (r, g, b) ->
    if typeof r is "object"
      g = r.g
      b = r.b
      r = r.r

    r /= 255
    g /= 255
    b /= 255

    max = Math.max r, g, b
    min = Math.min r, g, b
    l = (max + min) / 2

    if max is min
      h = s = 0
    else
      d = max - min
      s = if l > 0.5 then d / (2 - max - min) else d / (max + min)
      h = switch max
        when r then (g - b) / d + (if g < b then 6 else 0)
        when g then (b - r) / d + 2
        when b then (r - g) / d + 4
      
      h /= 6

    h: h, s: s, l: l

  # Converts an HSL color value to RGB. Conversion formula
  # adapted from http://en.wikipedia.org/wiki/HSL_color_space.
  # Assumes h, s, and l are contained in the set [0, 1] and
  # returns r, g, and b in the set [0, 255].
  #
  # @overload hslToRGB(h, s, l)
  #   @param   [Number]  h       The hue
  #   @param   [Number]  s       The saturation
  #   @param   [Number]  l       The lightness
  #
  # @overload hslToRGB(hsl)
  #   @param [Object] hsl The HSL object.
  #   @option hsl [Number] h The hue.
  #   @option hsl [Number] s The saturation.
  #   @option hsl [Number] l The lightness.
  #
  # @return  [Array]           The RGB representation
  @hslToRGB: (h, s, l) ->
    if typeof h is "object"
      s = h.s
      l = h.l
      h = h.h

    if s is 0
      r = g = b = l
    else
      q = if l < 0.5 then l * (1 + s) else l + s - l * s
      p = 2 * l - q
      
      r = @hueToRGB p, q, h + 1/3
      g = @hueToRGB p, q, h
      b = @hueToRGB p, q, h - 1/3

    r: r * 255, g: g * 255, b: b * 255

  # Converts from the hue color space back to RGB.
  #
  # @param [Number] p
  # @param [Number] q
  # @param [Number] t
  # @return [Number] RGB value
  @hueToRGB: (p, q, t) ->
    if t < 0 then t += 1
    if t > 1 then t -= 1
    if t < 1/6 then return p + (q - p) * 6 * t
    if t < 1/2 then return q
    if t < 2/3 then return p + (q - p) * (2/3 - t) * 6
    return p

  # Converts an RGB color value to HSV. Conversion formula
  # adapted from {http://en.wikipedia.org/wiki/HSV_color_space}.
  # Assumes r, g, and b are contained in the set [0, 255] and
  # returns h, s, and v in the set [0, 1].
  #
  # @param   [Number]  r       The red color value
  # @param   [Number]  g       The green color value
  # @param   [Number]  b       The blue color value
  # @return  [Array]           The HSV representation
  @rgbToHSV: (r, g, b) ->
    r /= 255
    g /= 255
    b /= 255

    max = Math.max r, g, b
    min = Math.min r, g, b
    v = max
    d = max - min

    s = if max is 0 then 0 else d / max

    if max is min
      h = 0
    else
      h = switch max
        when r then (g - b) / d + (if g < b then 6 else 0)
        when g then (b - r) / d + 2
        when b then (r - g) / d + 4

      h /= 6

    h: h, s: s, v: v

  # Converts an HSV color value to RGB. Conversion formula
  # adapted from http://en.wikipedia.org/wiki/HSV_color_space.
  # Assumes h, s, and v are contained in the set [0, 1] and
  # returns r, g, and b in the set [0, 255].
  #
  # @param   [Number]  h       The hue
  # @param   [Number]  s       The saturation
  # @param   [Number]  v       The value
  # @return  [Array]           The RGB representation
  @hsvToRGB: (h, s, v) ->
    i = Math.floor h * 6
    f = h * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)

    switch i % 6
      when 0 then r = v; g = t; b = p
      when 1 then r = q; g = v; b = p
      when 2 then r = p; g = v; b = t
      when 3 then r = p; g = q; b = v
      when 4 then r = t; g = p; b = v
      when 5 then r = v; g = p; b = q

    r: Math.floor(r * 255)
    g: Math.floor(g * 255)
    b: Math.floor(b * 255)

  # Converts a RGB color value to the XYZ color space. Formulas
  # are based on http://en.wikipedia.org/wiki/SRGB assuming that
  # RGB values are sRGB.
  #
  # Assumes r, g, and b are contained in the set [0, 255] and
  # returns x, y, and z.
  #
  # @param   [Number]  r       The red color value
  # @param   [Number]  g       The green color value
  # @param   [Number]  b       The blue color value
  # @return  [Array]           The XYZ representation
  @rgbToXYZ: (r, g, b) ->
    r /= 255
    g /= 255
    b /= 255

    if r > 0.04045
      r = Math.pow((r + 0.055) / 1.055, 2.4)
    else
      r /= 12.92

    if g > 0.04045
      g = Math.pow((g + 0.055) / 1.055, 2.4)
    else
      g /= 12.92

    if b > 0.04045
      b = Math.pow((b + 0.055) / 1.055, 2.4)
    else
      b /= 12.92

    x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  
    x: x * 100, y: y * 100, z: z * 100

  # Converts a XYZ color value to the sRGB color space. Formulas
  # are based on http://en.wikipedia.org/wiki/SRGB and the resulting
  # RGB value will be in the sRGB color space.
  # Assumes x, y and z values are whatever they are and returns
  # r, g and b in the set [0, 255].
  #
  # @param   [Number]  x       The X value
  # @param   [Number]  y       The Y value
  # @param   [Number]  z       The Z value
  # @return  [Array]           The RGB representation
  @xyzToRGB: (x, y, z) ->
    x /= 100
    y /= 100
    z /= 100

    r = (3.2406  * x) + (-1.5372 * y) + (-0.4986 * z)
    g = (-0.9689 * x) + (1.8758  * y) + (0.0415  * z)
    b = (0.0557  * x) + (-0.2040 * y) + (1.0570  * z)

    if r > 0.0031308
      r = (1.055 * Math.pow(r, 0.4166666667)) - 0.055
    else
      r *= 12.92

    if g > 0.0031308
      g = (1.055 * Math.pow(g, 0.4166666667)) - 0.055
    else
      g *= 12.92

    if b > 0.0031308
      b = (1.055 * Math.pow(b, 0.4166666667)) - 0.055
    else
      b *= 12.92

    r: r * 255, g: g * 255, b: b * 255

  # Converts a XYZ color value to the CIELAB color space. Formulas
  # are based on http://en.wikipedia.org/wiki/Lab_color_space
  # The reference white point used in the conversion is D65.
  # Assumes x, y and z values are whatever they are and returns
  # L*, a* and b* values
  #
  # @overload xyzToLab(x, y, z)
  #   @param   [Number]  x       The X value
  #   @param   [Number]  y       The Y value
  #   @param   [Number]  z       The Z value
  #
  # @overload xyzToLab(xyz)
  #   @param [Object] xyz The XYZ object.
  #   @option xyz [Number] x The X value.
  #   @option xyz [Number] y The Y value.
  #   @option xyz [Number] z The z value.
  #
  # @return [Array] The Lab representation
  @xyzToLab: (x, y, z) ->
    if typeof x is "object"
      y = x.y
      z = x.z
      x = x.x

    whiteX = 95.047
    whiteY = 100.0
    whiteZ = 108.883

    x /= whiteX
    y /= whiteY
    z /= whiteZ

    if x > 0.008856451679
      x = Math.pow(x, 0.3333333333)
    else
      x = (7.787037037 * x) + 0.1379310345
  
    if y > 0.008856451679
      y = Math.pow(y, 0.3333333333)
    else
      y = (7.787037037 * y) + 0.1379310345
  
    if z > 0.008856451679
      z = Math.pow(z, 0.3333333333)
    else
      z = (7.787037037 * z) + 0.1379310345

    l = 116 * y - 16
    a = 500 * (x - y)
    b = 200 * (y - z)

    l: l, a: a, b: b

  # Converts a L*, a*, b* color values from the CIELAB color space
  # to the XYZ color space. Formulas are based on
  # http://en.wikipedia.org/wiki/Lab_color_space
  #
  # The reference white point used in the conversion is D65.
  # Assumes L*, a* and b* values are whatever they are and returns
  # x, y and z values.
  #
  # @overload labToXYZ(l, a, b)
  #   @param   [Number]  l       The L* value
  #   @param   [Number]  a       The a* value
  #   @param   [Number]  b       The b* value
  #
  # @overload labToXYZ(lab)
  #   @param [Object] lab The LAB values
  #   @option lab [Number] l The L* value.
  #   @option lab [Number] a The a* value.
  #   @option lab [Number] b The b* value.
  #
  # @return  [Array]           The XYZ representation
  @labToXYZ: (l, a, b) ->
    if typeof l is "object"
      a = l.a
      b = l.b
      l = l.l

    y = (l + 16) / 116
    x = y + (a / 500)
    z = y - (b / 200)

    if x > 0.2068965517
      x = x * x * x
    else
      x = 0.1284185493 * (x - 0.1379310345)
  
    if y > 0.2068965517
      y = y * y * y
    else
      y = 0.1284185493 * (y - 0.1379310345)
  
    if z > 0.2068965517
      z = z * z * z
    else
      z = 0.1284185493 * (z - 0.1379310345)

    # D65 reference white point
    x: x * 95.047, y: y * 100.0, z: z * 108.883

  # Converts L*, a*, b* back to RGB values.
  #
  # @see Convert.rgbToXYZ
  # @see Convert.xyzToLab
  @rgbToLab: (r, g, b) ->
    if typeof r is "object"
      g = r.g
      b = r.b
      r = r.r
    
    xyz = @rgbToXYZ(r, g, b)
    @xyzToLab xyz

  @labToRGB: (l, a, b) ->
    
Convert = Caman.Convert