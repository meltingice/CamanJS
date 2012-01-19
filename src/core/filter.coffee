# Responsible for storing all of the filters
class Filter
  # All of the different render operatives
  @Type =
    Single: 1
    Kernel: 2
    LayerDequeue: 3
    LayerFinished: 4
    LoadOverlay: 5
    Plugin: 6

  # Registers a filter function
  @register: (name, filterFunc) -> CamanInstance::[name] = filterFunc

  # Begins the rendering process
  render: (callback = ->) ->
    @processNext =>
      @context.putImageData @imageData, 0, 0
      callback.call @

  # Reverts an image back to it's original state by re-initializing Caman
  revert: (ready) ->
    @loadCanvas @options.image, @options.canvas, ready

  # Pushes the filter callback that modifies the RGBA object into the
  # render queue
  process: (name, processFn) ->
    @renderQueue.push
      type: Filter.Type.Single
      name: name
      processFn: processFn

    return @

  # Pushes the kernel into the render queue
  processKernel: (name, adjust, divisor, bias) ->
    if not divisor
      divisor = 0
      divisor += adjust[i] for i in [0...adjust.length]

    @renderQueue.push
      type: Filter.Type.Kernel
      name: name
      adjust: adjust
      divisor: divisor
      bias: bias or 0

    return @

  # Adds a standalone plugin into the render queue
  processPlugin: (plugin, args) ->
    @renderQueue.push
      type: Filter.Type.Plugin
      plugin: plugin
      args: args

    return @

  # Grabs the next operation from the render queue and passes it to RenderJob
  # for execution
  processNext: (finishedFn) ->
    @finishedFn = finishedFn if typeof finishedFn is "function"

    # If the queue is empty, fire the finished callback
    if @renderQueue.length is 0
      if @finishedFn?
        Event.trigger @, "renderFinished"
        @finishedFn.call(@)

      return @

    next = @renderQueue.shift()
    RenderJob.execute @, next, => @processNext()

  # Pushes a new layer operation into the render queue and calls the layer
  # callback
  newLayer: (callback) ->
    layer = new Layer @
    @canvasQueue.push layer
    @renderQueue.push type: Filter.Type.LayerDequeue

    callback.call layer

    @renderQueue.push type: Filter.Type.LayerFinished
    return @

  # Pushes the layer context and moves to the next operation
  executeLayer: (layer) ->
    @pushContext layer
    @processNext()

  # Set all of the relevant data to the new layer
  pushContext: (layer) ->
    @layerStack.push @currentLayer
    @pixelStack.push @pixelData
    @currentLayer = layer
    @pixelData = layer.pixelData

  # Restore the previous layer context
  popContext: ->
    @pixelData = @pixelStack.pop()
    @currentLayer = @layerStack.pop()

  # Applies the current layer to its parent layer
  applyCurrentLayer: -> @currentLayer.applyToParent()

Util.extend CamanInstance::, Filter::
Caman.Filter = Filter