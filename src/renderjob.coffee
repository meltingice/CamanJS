class RenderJob
  @Blocks = 4

  @execute: (instance, job, callback) ->
    rj = new RenderJob instance, job, callback

    switch job.type
      when Filter.Type.Single then rj.executeFilter()

  constructor: (@c, @job, @renderDone) ->

  executeFilter: ->
    # Prepare all the required render data
    @blocksDone = 0

    n = @c.pixelData.length
    blockPixelLength = Math.floor (n / 4) / RenderJob.Blocks
    blockN = blockPixelLength * 4
    lastBlockN = blockN + ((n / 4) % RenderJob.Blocks) * 4

    # TODO: trigger event
    if @job.type is Filter.Type.Single
      for j in [0...RenderJob.Blocks]
        start = j * blockN
        end = start + (if j is RenderJob.Blocks - 1 then lastBlockN else blockN)

        setTimeout do (j, start, end) => 
          => @renderBlock(j, start, end)
        , 0

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

      @c.pixelData[i] = clampRGB res.r
      @c.pixelData[i+1] = clampRGB res.g
      @c.pixelData[i+2] = clampRGB res.b

    @blockFinished(bnum)

  blockFinished: (bnum) ->
    Log.debug "Block ##{bnum} finished! Filter: #{@job.name}" if bnum >= 0
    @blocksDone++

    if @blocksDone is RenderJob.Blocks or bnum is -1
      Log.debug "Filter #{@job.name} finished!" if bnum >=0
      Log.debug "Kernel filter #{@job.name} finished!" if bnum < 0

      # TODO: trigger event
      @renderDone()