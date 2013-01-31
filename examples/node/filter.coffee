{Caman} = require __dirname + '/../../dist/caman.full'
Caman.DEBUG = true
Caman.allowRevert = false

Caman __dirname + "/../images/test1_1280.jpg", ->
  @concentrate()

  start = (new Date()).getTime()
  @render ->
    end = (new Date()).getTime()
    console.log "Rendered in #{end - start}ms"
    console.log "Memory:", process.memoryUsage()
    
    @save "./output.jpg"