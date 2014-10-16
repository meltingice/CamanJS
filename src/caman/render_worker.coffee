RSVP = require 'rsvp'

module.exports = class RenderWorker
  constructor: (@context, @id, @start, @end) ->
    @pixelData = @context.pixelData

  process: (job) ->
    # console.log "Worker #{@id} - rendering #{job.name}"
    processor = job.item
    processor.setup()
    
    for i in [@start...@end] by 4
      processor.setPixel i, @pixelData[i],
        @pixelData[i+1],
        @pixelData[i+2],
        @pixelData[i+3]

      processor.execute()

    processor.finish()
