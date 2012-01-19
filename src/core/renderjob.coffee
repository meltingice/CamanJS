# Handles all of the various rendering methods in Caman. Most of the image modification happens 
# here. A new RenderJob object is created for every render operation.
class RenderJob
  # The number of blocks to split the image into during the render process to simulate 
  # concurrency. This also helps the browser manage the (possibly) long running render jobs.
  @Blocks = 4

  @execute: (instance, job, callback) ->
    rj = new RenderJob instance, job, callback

    switch job.type
      when Filter.Type.LayerDequeue
        layer = instance.canvasQueue.shift()
        instance.executeLayer layer
      when Filter.Type.LayerFinished
        instance.applyCurrentLayer()
        instance.popContext()
        callback()
      when Filter.Type.LoadOverlay then rj.loadOverlay job.layer, job.src
      when Filter.Type.Plugin then rj.executePlugin()
      else rj.executeFilter()

    return instance

  constructor: (@c, @job, @renderDone) ->

  # The core of the image rendering, this function executes the provided filter.
  #
  # NOTE: this does not write the updated pixel data to the canvas. That happens when all filters 
  # are finished rendering in order to be as fast as possible.
  executeFilter: ->
    # Prepare all the required render data
    @blocksDone = 0

    n = @c.pixelData.length
    blockPixelLength = Math.floor (n / 4) / RenderJob.Blocks
    blockN = blockPixelLength * 4
    lastBlockN = blockN + ((n / 4) % RenderJob.Blocks) * 4

    Event.trigger @c, "processStart", @job

    if @job.type is Filter.Type.Single
      for j in [0...RenderJob.Blocks]
        start = j * blockN
        end = start + (if j is RenderJob.Blocks - 1 then lastBlockN else blockN)

        setTimeout do (j, start, end) => 
          => @renderBlock(j, start, end)
        , 0
    else
      @renderKernel()

  # Executes a standalone plugin
  executePlugin: ->
    Log.debug "Executing plugin #{@job.plugin}"
    Plugin.execute @c, @job.plugin, @job.args
    Log.debug "Plugin #{@job.plugin} finished!"

    @renderDone()

  # Renders a single block of the canvas with the current filter function
  renderBlock: (bnum, start, end) ->
    Log.debug "BLOCK ##{bnum} - Filter: #{@job.name}, Start: #{start}, End: #{end}"

    data = r: 0, g: 0, b: 0, a: 0
    pixelInfo = new PixelInfo @c

    for i in [start...end] by 4
      pixelInfo.loc = i

      data.r = @c.pixelData[i]
      data.g = @c.pixelData[i+1]
      data.b = @c.pixelData[i+2]
      data.a = @c.pixelData[i+3]

      res = @job.processFn.call pixelInfo, data
      res.a = data.a if not res.a?

      @c.pixelData[i]   = Util.clampRGB res.r
      @c.pixelData[i+1] = Util.clampRGB res.g
      @c.pixelData[i+2] = Util.clampRGB res.b
      @c.pixelData[i+3] = Util.clampRGB res.a

    @blockFinished(bnum)

  # Applies an image kernel to the canvas
  renderKernel: ->
    name = @job.name
    bias = @job.bias
    divisor = @job.divisor
    n = @c.pixelData.length

    adjust = @job.adjust
    adjustSize = Math.sqrt adjust.length

    kernel = []
    modPixelData = []

    Log.debug "Rendering kernel - Filter: #{@job.name}"

    start = @c.dimensions.width * 4 * ((adjustSize - 1) / 2)
    end = n - (@c.dimensions.width * 4 * ((adjustSize - 1) / 2))

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

      modPixelData[i] = Util.clampRGB(res.r)
      modPixelData[i+1] = Util.clampRGB(res.g)
      modPixelData[i+2] = Util.clampRGB(res.b)
      modPixelData[i+3] = @c.pixelData[i+3]

    @c.pixelData[i] = modPixelData[i] for i in [start...end]

    @blockFinished -1

  # Called when a single block is finished rendering. Once all blocks are done, we signal that this
  # filter is finished rendering and continue to the next step.
  blockFinished: (bnum) ->
    Log.debug "Block ##{bnum} finished! Filter: #{@job.name}" if bnum >= 0
    @blocksDone++

    if @blocksDone is RenderJob.Blocks or bnum is -1
      Log.debug "Filter #{@job.name} finished!" if bnum >=0
      Log.debug "Kernel filter #{@job.name} finished!" if bnum < 0
      Event.trigger @c, "processComplete", @job

      @renderDone()

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

      @c.processNext()

    proxyUrl = IO.remoteCheck src
    img.src = if proxyUrl? then proxyUrl else src