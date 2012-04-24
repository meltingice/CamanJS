{Caman} = require __dirname + '/../../dist/caman.full'
Caman.DEBUG = true

Caman "../images/pic.jpg", ->
  @sunrise()
  @render -> @save "./output.jpg"