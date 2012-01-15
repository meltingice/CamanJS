class Layer
  constructor: (@c) ->
    # Compatibility
    @filter = @c
    
    @options =
      blendingMode: 'normal'
      opacity: 1.0

    @layerID = uniqid.get()
    @canvas = document.createElement 'canvas'
    
    @canvas.width = @c.dimensions.width
    @canvas.height = @c.dimensions.height

    @context = @canvas.getContext('2d')
    @context.createImageData @canvas.width, @canvas.height
    @imageData = @context.getImageData 0, 0, @canvas.width, @canvas.height
    @pixelData = @imageData.data

  newLayer: (cb) -> @c.newLayer.call @c, cb
  setBlendingMode: (mode) ->
    @options.blendingMode = mode
    return @

  opacity: (opacity) ->
    @options.opacity = opacity / 100
    return @

  copyParent: ->
    parentData = @c.pixelData

    for i in [0...@c.pixelData.length] by 4
      @pixelData[i]   = parentData[i]
      @pixelData[i+1] = parentData[i+1]
      @pixelData[i+2] = parentData[i+2]
      @pixelData[i+3] = parentData[i+3]

    return @

  fillColor: -> @c.fillcolor.apply @c, arguments

  overlayImage: (image) ->
    if typeof image is "object"
      image = image.src
    else if typeof image is "string" and image[0] is "#"
      image = $(image).src

    return @ if not image

    @c.renderQueue.push
      type: Filter.Type.LoadOverlay
      src: image
      layer: @

    return @

  applyToParent: ->
    parentData = @c.pixelStack[@c.pixelStack.length - 1]
    layerData = @c.pixelData
    
    for i in [0...layerData.length] by 4
      rgbaParent =
        r: parentData[i]
        g: parentData[i+1]
        b: parentData[i+2]
        a: parentData[i+3]

      rgbaLayer =
        r: layerData[i]
        g: layerData[i+1]
        b: layerData[i+2]
        a: layerData[i+3]

      result = Blender.execute @options.blendingMode, rgbaLayer, rgbaParent

      result.r = clampRGB result.r
      result.g = clampRGB result.g
      result.b = clampRGB result.b
      result.a = rgbaLayer.a if not result.a?

      parentData[i]   = rgbaParent.r - ((rgbaParent.r - result.r) * (this.options.opacity * (result.a / 255)))
      parentData[i+1] = rgbaParent.g - ((rgbaParent.g - result.g) * (this.options.opacity * (result.a / 255)))
      parentData[i+2] = rgbaParent.b - ((rgbaParent.b - result.b) * (this.options.opacity * (result.a / 255)))
