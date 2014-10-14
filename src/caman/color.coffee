module.exports =
  hexToRGB: (hex) ->
    hex = hex.substr(1) if hex.charAt(0) is "#"
    r = parseInt hex.substr(0, 2), 16
    g = parseInt hex.substr(2, 2), 16
    b = parseInt hex.substr(4, 2), 16

    [r, g, b]

  rgbToHSV: (r, g, b) ->
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

      [h, s, v]

  hsvToRGB: (h, s, v) ->
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

    [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)]
