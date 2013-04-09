# Handles all of the various rendering methods in Caman. Most of the image modification happens 
# here. A new Renderer object is created for every render operation.
Caman.Renderer = class Renderer
  # The number of blocks to split the image into during the render process to simulate 
  # concurrency. This also helps the browser manage the (possibly) long running render jobs.
  @Blocks = if Caman.NodeJS then require('os').cpus().length else 4

  constructor: (@c) ->
    @renderQueue = []
    @modPixelData = null

  add: (job) ->
    return unless job?
    @renderQueue.push job

  # Grabs the next operation from the render queue and passes it to Renderer
  # for execution
  processNext: =>
    # If the queue is empty, fire the finished callback
    if @renderQueue.length is 0
      Event.trigger @, "renderFinished"
      @finishedFn.call(@c) if @finishedFn?

      return @

    @currentJob = @renderQueue.shift()

    switch @currentJob.type
      when Filter.Type.LayerDequeue
        layer = @c.canvasQueue.shift()
        @c.executeLayer layer
        @processNext()
      when Filter.Type.LayerFinished
        @c.applyCurrentLayer()
        @c.popContext()
        @processNext()
      when Filter.Type.LoadOverlay
        @loadOverlay @currentJob.layer, @currentJob.src
      when Filter.Type.Plugin
        @executePlugin()
      else
        @executeFilter()

  execute: (callback) ->
    @finishedFn = callback
    @modPixelData = Util.dataArray(@c.pixelData.length)

    @processNext()

  eachBlock: (fn) ->
    # Prepare all the required render data
    @blocksDone = 0

    n = @c.pixelData.length
    blockPixelLength = Math.floor (n / 4) / Renderer.Blocks
    blockN = blockPixelLength * 4
    lastBlockN = blockN + ((n / 4) % Renderer.Blocks) * 4

    for i in [0...Renderer.Blocks]
      start = i * blockN
      end = start + (if i is Renderer.Blocks - 1 then lastBlockN else blockN)

      if Caman.NodeJS
        f = Fiber => fn.call(@, i, start, end)
        bnum = f.run()
        @blockFinished(bnum)
      else
        setTimeout do (i, start, end) =>
          => fn.call(@, i, start, end)
        , 0

  # The core of the image rendering, this function executes the provided filter.
  #
  # NOTE: this does not write the updated pixel data to the canvas. That happens when all filters 
  # are finished rendering in order to be as fast as possible.
  executeFilter: ->
    Event.trigger @c, "processStart", @currentJob

    if @currentJob.type is Filter.Type.Single
      @eachBlock @renderBlock
    else
      @eachBlock @renderKernel

  # Executes a standalone plugin
  executePlugin: ->
    Log.debug "Executing plugin #{@currentJob.plugin}"
    Plugin.execute @c, @currentJob.plugin, @currentJob.args
    Log.debug "Plugin #{@currentJob.plugin} finished!"

    @processNext()

  # Renders a single block of the canvas with the current filter function
  renderBlock: (bnum, start, end) ->
    Log.debug "Block ##{bnum} - Filter: #{@currentJob.name}, Start: #{start}, End: #{end}"
    Event.trigger @c, "blockStarted",
      blockNum: bnum
      totalBlocks: Renderer.Blocks
      startPixel: start
      endPixel: end

    data = r: 0, g: 0, b: 0, a: 0
    pixelInfo = new PixelInfo @c

    for i in [start...end] by 4
      pixelInfo.loc = i

      data.r = @c.pixelData[i]
      data.g = @c.pixelData[i+1]
      data.b = @c.pixelData[i+2]
      data.a = @c.pixelData[i+3]

      res = @currentJob.processFn.call pixelInfo, data
      res.a = data.a if not res.a?

      @c.pixelData[i]   = Util.clampRGB res.r
      @c.pixelData[i+1] = Util.clampRGB res.g
      @c.pixelData[i+2] = Util.clampRGB res.b
      @c.pixelData[i+3] = Util.clampRGB res.a

    if Caman.NodeJS
      Fiber.yield(bnum)
    else
      @blockFinished bnum

  # Applies an image kernel to the canvas
  renderKernel: (bnum, start, end) ->
    name = @currentJob.name
    bias = @currentJob.bias
    divisor = @currentJob.divisor
    n = @c.pixelData.length

    adjust = @currentJob.adjust
    adjustSize = Math.sqrt adjust.length

    kernel = []

    Log.debug "Rendering kernel - Filter: #{@currentJob.name}"

    start = Math.max start, @c.dimensions.width * 4 * ((adjustSize - 1) / 2)
    end = Math.min end, n - (@c.dimensions.width * 4 * ((adjustSize - 1) / 2))

    builder = (adjustSize - 1) / 2

    pixelInfo = new PixelInfo @c

    for i in [start...end] by 4
      pixelInfo.loc = i
      builderIndex = 0

      for j in [-builder..builder]
        for k in [builder..-builder]
          pixel = pixelInfo.getPixelRelative j, k
          kernel[builderIndex * 3]     = pixel.r
          kernel[builderIndex * 3 + 1] = pixel.g
          kernel[builderIndex * 3 + 2] = pixel.b

          builderIndex++

      res = @processKernel adjust, kernel, divisor, bias

      @modPixelData[i]    = Util.clampRGB(res.r)
      @modPixelData[i+1]  = Util.clampRGB(res.g)
      @modPixelData[i+2]  = Util.clampRGB(res.b)
      @modPixelData[i+3]  = @c.pixelData[i+3]

    if Caman.NodeJS
      Fiber.yield(bnum)
    else
      @blockFinished bnum

  # Called when a single block is finished rendering. Once all blocks are done, we signal that this
  # filter is finished rendering and continue to the next step.
  blockFinished: (bnum) ->
    Log.debug "Block ##{bnum} finished! Filter: #{@currentJob.name}" if bnum >= 0
    @blocksDone++

    Event.trigger @c, "blockFinished",
      blockNum: bnum
      blocksFinished: @blocksDone
      totalBlocks: Renderer.Blocks

    if @blocksDone is Renderer.Blocks
      if @currentJob.type is Filter.Type.Kernel
        for i in [0...@c.pixelData.length]
          @c.pixelData[i] = @modPixelData[i]

      Log.debug "Filter #{@currentJob.name} finished!" if bnum >=0
      Event.trigger @c, "processComplete", @currentJob

      @processNext()

  # The "filter function" for kernel adjustments.
  processKernel: (adjust, kernel, divisor, bias) ->
    val = r: 0, g: 0, b: 0

    for i in [0...adjust.length]
      val.r += adjust[i] * kernel[i * 3]
      val.g += adjust[i] * kernel[i * 3 + 1]
      val.b += adjust[i] * kernel[i * 3 + 2]

    val.r = (val.r / divisor) + bias
    val.g = (val.g / divisor) + bias
    val.b = (val.b / divisor) + bias
    val

  # Loads an image onto the current canvas
  loadOverlay: (layer, src) ->
    img = document.createElement 'img'
    img.onload = =>
      layer.context.drawImage img, 0, 0, @c.dimensions.width, @c.dimensions.height
      layer.imageData = layer.context.getImageData 0, 0, @c.dimensions.width, @c.dimensions.height
      layer.pixelData = layer.imageData.data

      @c.pixelData = layer.pixelData

      @processNext()

    proxyUrl = IO.remoteCheck src
    img.src = if proxyUrl? then proxyUrl else src