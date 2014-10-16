Filter = require './filter.coffee'

module.exports = class KernelFilter extends Filter
  constructor: (@userKernel, @divisor = 0, @bias = 0) ->
    if @divisor is 0
      @divisor += @userKernel[i] for i in [0...@userKernel.length]

    @userKernelSize = Math.sqrt @userKernel.length
    @builder = (@userKernelSize - 1) / 2
    @currentKernel = []

    super(null)

  setup: ->
    @targetData = new Uint8ClampedArray(@pixelData.length)

  execute: ->
    @generateKernel()
    @processKernel()

    @targetData[@loc]   = @r
    @targetData[@loc+1] = @g
    @targetData[@loc+2] = @b
    @targetData[@loc+3] = @pixelData[@loc+3]

  finish: ->
    @pixelData[i] = p for p, i in @targetData
    @targetData = null

  generateKernel: ->
    builderIndex = 0
    for i in [-@builder..@builder]
      for j in [@builder..-@builder]
        p = @getPixelRelative(i, j)
        @currentKernel[builderIndex * 3]     = p[0]
        @currentKernel[builderIndex * 3 + 1] = p[1]
        @currentKernel[builderIndex * 3 + 2] = p[2]

        builderIndex++

    true
  
  processKernel: ->
    r = g = b = 0
    for i in [0...@userKernel.length]
      r += @userKernel[i] * @currentKernel[i * 3]
      g += @userKernel[i] * @currentKernel[i * 3 + 1]
      b += @userKernel[i] * @currentKernel[i * 3 + 2]

    @r = (r / @divisor) + @bias
    @g = (g / @divisor) + @bias
    @b = (b / @divisor) + @bias
