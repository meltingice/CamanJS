# The entire layering system for Caman resides in this file. Layers get their own canvasLayer 
# objectwhich is created when newLayer() is called. For extensive information regarding the 
# specifics of howthe layering system works, there is an in-depth blog post on this very topic. 
# Instead of copying the entirety of that post, I'll simply point you towards the 
# [blog link](http://blog.meltingice.net/programming/implementing-layers-camanjs).
#
# However, the gist of the layering system is that, for each layer, it creates a new canvas 
# element and then either copies the parent layer's data or applies a solid color to the new 
# layer. After some (optional) effects are applied, the layer is blended back into the parent 
# canvas layer using one of many different blending algorithms.
#
# You can also load an image (local or remote, with a proxy) into a canvas layer, which is useful 
# if you want to add textures to an image.
class Layer
  constructor: (@c) ->
    # Compatibility
    @filter = @c
    
    @options =
      blendingMode: 'normal'
      opacity: 1.0

    # Each layer gets its own unique ID
    @layerID = Util.uniqid.get()

    # Create the canvas for this layer
    @canvas = if exports? then new Canvas() else document.createElement('canvas')
    
    @canvas.width = @c.dimensions.width
    @canvas.height = @c.dimensions.height

    @context = @canvas.getContext('2d')
    @context.createImageData @canvas.width, @canvas.height
    @imageData = @context.getImageData 0, 0, @canvas.width, @canvas.height
    @pixelData = @imageData.data

  # If you want to create nested layers
  newLayer: (cb) -> @c.newLayer.call @c, cb

  # Sets the blending mode of this layer. The mode is the name of a blender function.
  setBlendingMode: (mode) ->
    @options.blendingMode = mode
    return @

  # Sets the opacity of this layer. This affects how much of this layer is applied to the parent
  # layer at render time.
  opacity: (opacity) ->
    @options.opacity = opacity / 100
    return @

  # Copies the contents of the parent layer to this layer
  copyParent: ->
    parentData = @c.pixelData

    for i in [0...@c.pixelData.length] by 4
      @pixelData[i]   = parentData[i]
      @pixelData[i+1] = parentData[i+1]
      @pixelData[i+2] = parentData[i+2]
      @pixelData[i+3] = parentData[i+3]

    return @

  # Fills this layer with a single color
  fillColor: -> @c.fillColor.apply @c, arguments

  # Loads and overlays an image onto this layer
  overlayImage: (image) ->
    if typeof image is "object"
      image = image.src
    else if typeof image is "string" and image[0] is "#"
      image = $(image).src

    return @ if not image

    @c.renderer.renderQueue.push
      type: Filter.Type.LoadOverlay
      src: image
      layer: @

    return @
  
  # Takes the contents of this layer and applies them to the parent layer at render time. This
  # should never be called explicitly by the user.
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

      result.r = Util.clampRGB result.r
      result.g = Util.clampRGB result.g
      result.b = Util.clampRGB result.b
      result.a = rgbaLayer.a if not result.a?

      parentData[i]   = rgbaParent.r - (
        (rgbaParent.r - result.r) * (@options.opacity * (result.a / 255))
      )
      parentData[i+1] = rgbaParent.g - (
        (rgbaParent.g - result.g) * (@options.opacity * (result.a / 255))
      )
      parentData[i+2] = rgbaParent.b - (
        (rgbaParent.b - result.b) * (@options.opacity * (result.a / 255))
      )
