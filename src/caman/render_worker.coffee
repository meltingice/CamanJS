RSVP = require 'rsvp'

module.exports = class RenderWorker
  constructor: (@context, @id, @start, @end) ->
    @pixelData = @context.pixelData

  process: (job) ->
    console.log "Worker #{@id} - rendering #{job.name}"
    new RSVP.Promise (resolve, reject) =>
      setTimeout =>
        processor = job.item
        
        for i in [@start...@end] by 4
          processor.setPixel @pixelData[i],
            @pixelData[i+1],
            @pixelData[i+2],
            @pixelData[i+3]

          processor.execute()

          @pixelData[i]   = processor.r
          @pixelData[i+1] = processor.g
          @pixelData[i+2] = processor.b
          @pixelData[i+3] = processor.a

        resolve(@id)
      , 0
