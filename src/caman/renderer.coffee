RSVP = require 'rsvp'

module.exports = class Renderer
  @register: (processName, processFunc) ->
    @::[processName] = (args...) ->
      @enqueue processFunc.apply(@, args)

  constructor: (@context) ->
    @renderQueue = []
    @pixelData = @context.pixelData

  enqueue: (item) ->
    @renderQueue.push item

  render: ->
    new RSVP.Promise (resolve, reject) =>
      until @renderQueue.length is 0
        @processJob @renderQueue.shift()

      @context.update()

      resolve(@)

  processJob: (job) ->
    for i in [0...@pixelData.length] by 4
      job.setPixel @pixelData[i],
        @pixelData[i+1],
        @pixelData[i+2],
        @pixelData[i+3]

      job.execute()

      @pixelData[i]   = job.r
      @pixelData[i+1] = job.g
      @pixelData[i+2] = job.b
      @pixelData[i+3] = job.a

    true

