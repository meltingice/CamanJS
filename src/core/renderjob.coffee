class RenderJob
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

  executeFilter: ->
    # Prepare all the required render data
    @blocksDone = 0

    n = @c.pixelData.length
    blockPixelLength = Math.floor (n / 4) / RenderJob.Blocks
    blockN = blockPixelLength * 4
    lastBlockN = blockN + ((n / 4) % RenderJob.Blocks) * 4

    Caman.Event.trigger @c, "processStart", @job

    if @job.type is Filter.Type.Single
      for j in [0...RenderJob.Blocks]
        start = j * blockN
        end = start + (if j is RenderJob.Blocks - 1 then lastBlockN else blockN)

        setTimeout do (j, start, end) => 
          => @renderBlock(j, start, end)
        , 0
    else
      @renderKernel()

  executePlugin: ->
    Log.debug "Executing plugin #{@job.plugin}"
    Plugin.execute @c, @job.plugin
    Log.debug "Plugin #{@job.plugin} finished!"

    @renderDone()

  renderBlock: (bnum, start, end) ->
    Log.debug "BLOCK ##{bnum} - Filter: #{@job.name}, Start: #{start}, End: #{end}"

    data = r: 0, g: 0, b: 0, a: 0
    pixelInfo = new PixelInfo @c

    for i in [start...end] by 4
      pixelInfo.loc = i

      data.r = @c.pixelData[i]
      data.g = @c.pixelData[i+1]
      data.b = @c.pixelData[i+2]

      res = @job.processFn.call pixelInfo, data

      @c.pixelData[i]   = clampRGB res.r
      @c.pixelData[i+1] = clampRGB res.g
      @c.pixelData[i+2] = clampRGB res.b

    @blockFinished(bnum)

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

      modPixelData[i] = clampRGB(res.r)
      modPixelData[i+1] = clampRGB(res.g)
      modPixelData[i+2] = clampRGB(res.b)
      modPixelData[i+3] = 255

    @c.pixelData[i] = modPixelData[i] for i in [start...end]

    @blockFinished -1

  blockFinished: (bnum) ->
    Log.debug "Block ##{bnum} finished! Filter: #{@job.name}" if bnum >= 0
    @blocksDone++

    if @blocksDone is RenderJob.Blocks or bnum is -1
      Log.debug "Filter #{@job.name} finished!" if bnum >=0
      Log.debug "Kernel filter #{@job.name} finished!" if bnum < 0
      Caman.Event.trigger @c, "processComplete", @job

      @renderDone()

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

  loadOverlay: (layer, src) ->
    # TODO: image proxy
    img = document.createElement 'img'
    img.onload = =>
      layer.context.drawImage img, 0, 0, @c.dimensions.width, @c.dimensions.height
      layer.imageData = layer.context.getImageData 0, 0, @c.dimensions.width, @c.dimensions.height
      layer.pixelData = layer.imageData.data

      @pixelData = layer.pixelData

      @c.processNext()

    img.src = src