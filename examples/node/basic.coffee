{Caman} = require __dirname + '/../../dist/caman.full'
Caman.DEBUG = true

Caman "../images/test1_1280.jpg", ->
  @brightness 10
  @contrast 30
  @sepia 75

  @render -> @save "./output.jpg"