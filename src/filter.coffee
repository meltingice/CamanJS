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

  processKernel: (name, adjust, divisor, bias) ->
    if not divisor
      divisor = 0
      divisor += adjust[i] for i in [0...adjust.length]

    data =
      adjust: adjust
      divisor: divisor
      bias: bias or 0

    @renderQueue.push
      type: Filter.Type.Kernel
      name: name
      adjust: adjust
      divisor: divisor
      bias: bias or 0

  processNext: (finishedFn) ->
    @finishedFn = finishedFn if typeof finishedFn is "function"

    if @renderQueue.length is 0
      # TODO: trigger event
      @finishedFn.call(@) if @finishedFn?
      return

    next = @renderQueue.shift()
    RenderJob.execute @, next, => @processNext()

extend CamanInstance::, Filter::
Caman.Filter = Filter