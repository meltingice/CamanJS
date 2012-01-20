Caman = require('../../dist/caman.full.js').Caman
Caman.DEBUG = true

Caman "../images/test1_1280.jpg", ->
  @brightness 10
  @contrast 30
  @sepia 75

  @render -> @save "./output.jpg"