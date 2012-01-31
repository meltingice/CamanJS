# Directly apply the child layer's pixels to the parent layer with no special changes
Blender.register "normal", (rgbaLayer, rgbaParent) ->
  r: rgbaLayer.r
  g: rgbaLayer.g
  b: rgbaLayer.b

# Apply the child to the parent by multiplying the color values. This generally creates contrast.
Blender.register "multiply", (rgbaLayer, rgbaParent) ->
  r: (rgbaLayer.r * rgbaParent.r) / 255
  g: (rgbaLayer.g * rgbaParent.g) / 255
  b: (rgbaLayer.b * rgbaParent.b) / 255

Blender.register "screen", (rgbaLayer, rgbaParent) ->
  r: 255 - (((255 - rgbaLayer.r) * (255 - rgbaParent.r)) / 255)
  g: 255 - (((255 - rgbaLayer.g) * (255 - rgbaParent.g)) / 255)
  b: 255 - (((255 - rgbaLayer.b) * (255 - rgbaParent.b)) / 255)
  

Blender.register "overlay", (rgbaLayer, rgbaParent) ->
  result = {}
  result.r = 
    if rgbaParent.r > 128
      255 - 2 * (255 - rgbaLayer.r) * (255 - rgbaParent.r) / 255
    else (rgbaParent.r * rgbaLayer.r * 2) / 255

  result.g =
    if rgbaParent.g > 128
      255 - 2 * (255 - rgbaLayer.g) * (255 - rgbaParent.g) / 255
    else (rgbaParent.g * rgbaLayer.g * 2) / 255

  result.b =
    if rgbaParent.b > 128
      255 - 2 * (255 - rgbaLayer.b) * (255 - rgbaParent.b) / 255
    else (rgbaParent.b * rgbaLayer.b * 2) / 255

  result

Blender.register "difference", (rgbaLayer, rgbaParent) ->
  r: rgbaLayer.r - rgbaParent.r
  g: rgbaLayer.g - rgbaParent.g
  b: rgbaLayer.b - rgbaParent.b

Blender.register "addition", (rgbaLayer, rgbaParent) ->
  r: rgbaParent.r + rgbaLayer.r
  g: rgbaParent.g + rgbaLayer.g
  b: rgbaParent.b + rgbaLayer.b

Blender.register "exclusion", (rgbaLayer, rgbaParent) ->
  r: 128 - 2 * (rgbaParent.r - 128) * (rgbaLayer.r - 128) / 255
  g: 128 - 2 * (rgbaParent.g - 128) * (rgbaLayer.g - 128) / 255
  b: 128 - 2 * (rgbaParent.b - 128) * (rgbaLayer.b - 128) / 255

Blender.register "softLight", (rgbaLayer, rgbaParent) ->
  result = {}

  result.r =
    if rgbaParent.r > 128
      255 - ((255 - rgbaParent.r) * (255 - (rgbaLayer.r - 128))) / 255
    else (rgbaParent.r * (rgbaLayer.r + 128)) / 255

  result.g =
    if rgbaParent.g > 128
      255 - ((255 - rgbaParent.g) * (255 - (rgbaLayer.g - 128))) / 255
    else (rgbaParent.g * (rgbaLayer.g + 128)) / 255

  result.b =
    if rgbaParent.b > 128
      255 - ((255 - rgbaParent.b) * (255 - (rgbaLayer.b - 128))) / 255
    else (rgbaParent.b * (rgbaLayer.b + 128)) / 255

  result

Blender.register "lighten", (rgbaLayer, rgbaParent) ->
  r: if rgbaParent.r > rgbaLayer.r then rgbaParent.r else rgbaLayer.r
  g: if rgbaParent.g > rgbaLayer.g then rgbaParent.g else rgbaLayer.g
  b: if rgbaParent.b > rgbaLayer.b then rgbaParent.b else rgbaLayer.b

Blender.register "darken", (rgbaLayer, rgbaParent) ->
  r: if rgbaParent.r > rgbaLayer.r then rgbaLayer.r else rgbaParent.r
  g: if rgbaParent.g > rgbaLayer.g then rgbaLayer.g else rgbaParent.g
  b: if rgbaParent.b > rgbaLayer.b then rgbaLayer.b else rgbaParent.b