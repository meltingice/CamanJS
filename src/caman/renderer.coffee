RSVP = require 'rsvp'
RenderWorker = require './render_worker.coffee'

module.exports = class Renderer
  @register: (processName, processFunc) ->
    @::[processName] = (args...) ->
      @enqueue processName, processFunc.apply(@, args)
      return @

  # Use this if your filter finishes by enqueuing a different filter
  @registerAlias: (processName, processFunc) ->
    @::[processName] = (args...) ->
      processFunc.apply(@, args)

  @Blocks = 1

  constructor: (@context) ->
    @renderQueue = []
    @pixelData = @context.pixelData
    @workers = []

    @createWorkers()

  createWorkers: ->
    n = @pixelData.length
    blockPixelLength = Math.floor (n / 4) / Renderer.Blocks
    blockN = blockPixelLength * 4
    lastBlockN = blockN + ((n / 4) % Renderer.Blocks) * 4

    for i in [0...Renderer.Blocks]
      start = i * blockN
      end = start + (if i is Renderer.Blocks - 1 then lastBlockN else blockN)

      @workers.push new RenderWorker(@context, i, start, end)

  enqueue: (name, item) ->
    @renderQueue.push name: name, item: item

  render: ->
    new RSVP.Promise (resolve, reject) =>
      setTimeout =>
        @processNext() until @renderQueue.length is 0
        @context.update()
        resolve()
      , 0

  processNext: ->
    job = @renderQueue.shift()
    worker.process(job) for worker in @workers

