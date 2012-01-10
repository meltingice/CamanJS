class Convert
  @hexToRGB: (hex) ->
    hex = hex.substr(1) if hex.charAt(0) is "#"
    r = parseInt hex.substr(0, 2), 16
    g = parseInt hex.substr(2, 2), 16
    b = parseInt hex.substr(4, 2), 16

    r: r, g: g, b: b

  @rgbToHSL: (r, g, b) ->
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

  @hslToRGB: (h, s, l) ->
    if s is 0
      r = g = b = l
    else
      q = if l < 0.5 then l * (1 + s) else l + s - l * s
      p = 2 * l - q
      
      r = @hueToRGB p, q, h + 1/3
      g = @hueToRGB p, q, h
      b = @hueToRGB p, q, h - 1/3

    r: r * 255, g: g * 255, b: b * 255

  @hueToRGB: (p, q, t) ->
    if t < 0 then t += 1
    if t > 1 then t -= 1
    if t < 1/6 then return p + (q - p) * 6 * t
    if t < 1/2 then return q
    if t < 2/3 then return p + (q - p) * (2/3 - t) * 6
    return p

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

  @hsvToRGB: (h, s, v) ->
    i = Math.floor h * 6
    f = h * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)

    switch i % 6
      when 0
        r = v
        g = t
        b = p
      when 1
        r = q
        g = v
        b = p
      when 2
        r = p
        g = v
        b = t
      when 3
        r = p
        g = q
        b = v
      when 4
        r = t
        g = p
        b = v
      when 5
        r = v
        g = p
        b = q

    r: r * 255, g: g * 255, b: b * 255

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

  @xyzToLab: (x, y, z) ->
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

  @labToXYZ: (l, a, b) ->
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