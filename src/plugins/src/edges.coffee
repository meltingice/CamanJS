Caman.Filter.register "edgeEnhance", ->
  @processKernel "Edge Enhance", [
    0, 0, 0,
    -1, 1, 0,
    0, 0, 0
  ]

Caman.Filter.register "edgeDetect", ->
  @processKernel "Edge Detect", [
    -1, -1, -1,
    -1, 8, -1,
    -1, -1, -1
  ]

Caman.Filter.register "emboss", ->
  @processKernel "Emboss", [
    -2, -1, 0,
    -1, 1, 1,
    0, 1, 2
  ]