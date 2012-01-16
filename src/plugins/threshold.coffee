Caman.Filter.register "threshold", (adjust) ->
  @process "threshold", (rgba) ->
    luminance = (0.2126 * rgba.r) + (0.7152 * rgba.g) + (0.0722 * rgba.b)

    if luminance < adjust
      rgba.r = 0
      rgba.g = 0
      rgba.b = 0
    else
      rgba.r = 255
      rgba.g = 255
      rgba.b = 255
    
    rgba