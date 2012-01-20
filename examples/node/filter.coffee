Caman = require('../../dist/caman.full.js').Caman
Caman.DEBUG = true

Caman "../images/test1_1280.jpg", ->
  @concentrate()
  @render -> @save "./output.jpg"