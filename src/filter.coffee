class Filter
  @Type =
    Single: 1
    Kernel: 2
    LayerDequeued: 3
    LayerFinished: 4
    LoadOverlay: 5
    Plugin: 6

  @register: (name, filterFunc) -> CamanInstance::[name] = filterFunc

  render: (callback = ->) ->
    @processNext =>
      @context.putImageData @imageData, 0, 0
      callback.call @

  process: (name, processFn) ->
    @renderQueue.push
      type: Filter.Type.Single
      name: name
      processFn: processFn

  processNext: (finishedFn) ->
    @finishedFn = finishedFn if typeof finishedFn is "function"

    if @renderQueue.length is 0
      # TODO: trigger event
      @finishedFn.call(@) if @finishedFn?
      return

    next = @renderQueue.shift()
    RenderJob.execute @, next, => @processNext()

extend CamanInstance::, Filter::