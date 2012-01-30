Caman = require('../../dist/caman.full.js').Caman
Caman.DEBUG = true

Caman "../images/pic.jpg", ->
  @sunrise()
  @render -> @save "./output.jpg"