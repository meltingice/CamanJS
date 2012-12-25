{Caman} = require __dirname + '/../../dist/caman.full'
Caman.DEBUG = true

Caman __dirname + "/../images/test1_1280.jpg", ->
  @brightness 10
  @contrast 30
  @sepia 75

  start = (new Date()).getTime()
  @render ->
    end = (new Date()).getTime()
    console.log "Rendered in #{end - start}ms"
    
    @save "./output.jpg"