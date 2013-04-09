# NodeJS compatibility
if exports?
  Root = exports
  Canvas = require 'canvas'
  Image = Canvas.Image

  Fiber = require 'fibers'

  fs = require 'fs'
else
  Root = window

# Here it begins. Caman is defined.
# There are many different initialization for Caman, which are described on the 
# [Basic Usage](http://camanjs.com/docs) page.
#
# Initialization is tricky because we need to make sure everything we need is actually fully 
# loaded in the DOM before proceeding. When initialized on an image, we need to make sure that the 
# image is done loading before converting it to a canvas element and writing the pixel data. If we 
# do this prematurely, the browser will throw a DOM Error, and chaos will ensue. In the event that 
# we initialize Caman on a canvas element while specifying an image URL, we need to create a new 
# image element, load the image, then continue with initialization.
#
# The main goal for Caman was simplicity, so all of this is handled transparently to the end-user. 
Root.Caman = class Caman
  @version:
    release: "4.1.1"
    date: "4/8/2013"

  # Debug mode enables console logging
  @DEBUG: false

  # Are we in a NodeJS environment?
  @NodeJS: exports?

  # Should we check the DOM for images with Caman instructions?
  @autoload: not Caman.NodeJS

  # Allow reverting the canvas?
  # If your JS process is running out of memory, disabling
  # this could help drastically.
  @allowRevert: true

  # Default cross-origin policy
  @crossOrigin: "anonymous"

  @toString: ->
    "Version " + Caman.version.release + ", Released " + Caman.version.date;

  # Set the URL of the image proxy script
  @remoteProxy: ""

  # Change the GET param used with the proxy script if needed
  @proxyParam: "camanProxyUrl"

  @getAttrId: (canvas) ->
    return true if Caman.NodeJS

    if typeof canvas is "string"
      canvas = $(canvas)

    return null unless canvas? and canvas.getAttribute?
    canvas.getAttribute 'data-caman-id'

  constructor: ->
    throw "Invalid arguments" if arguments.length is 0

    if @ instanceof Caman
      # We have to do this to avoid polluting the global scope
      # because of how Coffeescript binds functions specified 
      # with => and the fact that Caman can be invoked as both
      # a function and as a 'new' object.
      @finishInit = @finishInit.bind(@)
      @imageLoaded = @imageLoaded.bind(@)

      args = arguments[0]

      unless Caman.NodeJS
        id = parseInt Caman.getAttrId(args[0]), 10
        callback = if typeof args[1] is "function"
          args[1]
        else if typeof args[2] is "function"
          args[2]
        else
          ->

        if !isNaN(id) and Store.has(id)
          return Store.execute(id, callback)

      # Every instance gets a unique ID. Makes it much simpler to check if two variables are the 
      # same instance.
      @id = Util.uniqid.get()
      
      @initializedPixelData = @originalPixelData = null
      @cropCoordinates = x: 0, y: 0
      @cropped = false
      @resized = false

      @pixelStack = []  # Stores the pixel layers
      @layerStack = []  # Stores all of the layers waiting to be rendered
      @canvasQueue = [] # Stores all of the canvases to be processed
      @currentLayer = null
      @scaled = false

      @analyze = new Analyze @
      @renderer = new Renderer @

      @domIsLoaded =>  
        @parseArguments(args)
        @setup()

      return @
    else
      return new Caman(arguments)

  domIsLoaded: (cb) ->
    if Caman.NodeJS
      setTimeout =>
        cb.call(@)
      , 0
    else
      if document.readyState is "complete"
        Log.debug "DOM initialized"
        setTimeout =>
          cb.call(@)
        , 0
      else
        listener = =>
          if document.readyState is "complete"
            Log.debug "DOM initialized"
            cb.call(@)

        document.addEventListener "readystatechange", listener, false

  # All possible combinations:
  #
  # **1 argument**
  #   - Image selector
  #   - Image object
  #   - Canvas selector
  #   - Canvas object
  #
  # **2 arguments**
  #   - Image selector + callback
  #   - Image object + callback
  #   - Canvas selector + URL
  #   - Canvas object + URL
  #
  # **3 arguments**
  #   - Canvas selector + URL + callback
  #   - Canvas object + URL + callback
  #
  # **NodeJS**
  #   - file path
  #   - file object
  #   - file path + callback
  #   - file object + callback
  parseArguments: (args) ->
    throw "Invalid arguments given" if args.length is 0

    # Defaults
    @initObj = null
    @initType = null
    @imageUrl = null
    @callback = ->

    # First argument is always our canvas/image
    @setInitObject args[0]
    return if args.length is 1
    
    switch typeof args[1]
      when "string" then @imageUrl = args[1]
      when "function" then @callback = args[1]
      
    return if args.length is 2

    @callback = args[2]

    if args.length is 4
      @options[key] = val for own key, val of args[4]

  setInitObject: (obj) ->
    if Caman.NodeJS
      @initObj = obj
      @initType = 'node'
      return

    if typeof obj is "object"
      @initObj = obj
    else
      @initObj = $(obj)

    throw "Could not find image or canvas for initialization." unless @initObj?

    @initType = @initObj.nodeName.toLowerCase()

  setup: ->
    switch @initType
      when "node" then @initNode()
      when "img" then @initImage()
      when "canvas" then @initCanvas()

  initNode: ->
    Log.debug "Initializing for NodeJS"

    @image = new Image()
    @image.onload = =>
      Log.debug "Image loaded. Width = #{@imageWidth()}, Height = #{@imageHeight()}"
      @canvas = new Canvas @imageWidth(), @imageHeight()
      @finishInit()

    @image.onerror = (err) -> throw err
    @image.src = @initObj

  initImage: ->
    @image = @initObj
    @canvas = document.createElement 'canvas'
    @context = @canvas.getContext '2d'
    Util.copyAttributes @image, @canvas, except: ['src']

    @image.parentNode.replaceChild @canvas, @image

    @imageAdjustments()
    @waitForImageLoaded()

  initCanvas: ->
    @canvas = @initObj
    @context = @canvas.getContext '2d'

    if @imageUrl?
      @image = document.createElement 'img'
      @image.src = @imageUrl

      @imageAdjustments()
      @waitForImageLoaded()
    else
      @finishInit()

  imageAdjustments: ->
    if @needsHiDPISwap()
      Log.debug @image.src, "->", @hiDPIReplacement()

      @swapped = true
      @image.src = @hiDPIReplacement()

    if IO.isRemote(@image)
      @image.src = IO.proxyUrl(@image.src)
      Log.debug "Remote image detected, using URL = #{@image.src}"

  waitForImageLoaded: ->
    if @isImageLoaded()
      @imageLoaded()
    else
      @image.onload = @imageLoaded

  isImageLoaded: ->
    return false unless @image.complete
    return false if @image.naturalWidth? and @image.naturalWidth is 0
    return true

  # Internet Explorer has issues figuring out image dimensions when they aren't
  # explicitly defined apparently. We check the normal width/height properties first,
  # but fall back to natural sizes if they are 0.
  imageWidth: -> @image.width or @image.naturalWidth
  imageHeight: -> @image.height or @image.naturalHeight

  imageLoaded: ->
    Log.debug "Image loaded. Width = #{@imageWidth()}, Height = #{@imageHeight()}"

    if @swapped
      @canvas.width = @imageWidth() / @hiDPIRatio()
      @canvas.height = @imageHeight() / @hiDPIRatio()
    else
      @canvas.width = @imageWidth()
      @canvas.height = @imageHeight()

    @finishInit()

  finishInit: ->
    @context = @canvas.getContext '2d' unless @context?

    @originalWidth = @preScaledWidth = @width = @canvas.width
    @originalHeight = @preScaledHeight = @height = @canvas.height

    @hiDPIAdjustments()
    @assignId() unless @hasId()

    if @image?
      @context.drawImage @image, 
        0, 0, 
        @imageWidth(), @imageHeight(), 
        0, 0, 
        @preScaledWidth, @preScaledHeight
    
    @reloadCanvasData()
    
    if Caman.allowRevert
      @initializedPixelData = Util.dataArray(@pixelData.length)
      @originalPixelData = Util.dataArray(@pixelData.length)

      for pixel, i in @pixelData
        @initializedPixelData[i] = pixel
        @originalPixelData[i] = pixel

    @dimensions =
      width: @canvas.width
      height: @canvas.height

    Store.put @id, @

    @callback.call @,@

    # Reset the callback so re-initialization doesn't
    # trigger it again.
    @callback = ->

  # If you have a separate context reference to this canvas outside of CamanJS
  # and you make a change to the canvas outside of CamanJS, you will have to call
  # this function to update our context reference to include those changes.
  reloadCanvasData: ->
    @imageData = @context.getImageData 0, 0, @canvas.width, @canvas.height
    @pixelData = @imageData.data

  resetOriginalPixelData: ->
    throw "Revert disabled" unless Caman.allowRevert

    @originalPixelData = Util.dataArray(@pixelData.length)
    @originalPixelData.push pixel for pixel in @pixelData

  hasId: -> Caman.getAttrId(@canvas)?

  assignId: ->
    return if Caman.NodeJS or @canvas.getAttribute 'data-caman-id'
    @canvas.setAttribute 'data-caman-id', @id

  hiDPIDisabled: ->
    @canvas.getAttribute('data-caman-hidpi-disabled') isnt null

  hiDPIAdjustments: ->
    return if Caman.NodeJS or @hiDPIDisabled()

    ratio = @hiDPIRatio()

    if ratio isnt 1
      Log.debug "HiDPI ratio = #{ratio}"
      @scaled = true

      @preScaledWidth = @canvas.width
      @preScaledHeight = @canvas.height

      @canvas.width = @preScaledWidth * ratio
      @canvas.height = @preScaledHeight * ratio
      @canvas.style.width = "#{@preScaledWidth}px"
      @canvas.style.height = "#{@preScaledHeight}px"

      @context.scale ratio, ratio

      @width = @originalWidth = @canvas.width
      @height = @originalHeight = @canvas.height

  hiDPIRatio: ->
    devicePixelRatio = window.devicePixelRatio or 1
    backingStoreRatio = @context.webkitBackingStorePixelRatio or
                        @context.mozBackingStorePixelRatio or
                        @context.msBackingStorePixelRatio or
                        @context.oBackingStorePixelRatio or
                        @context.backingStorePixelRatio or 1

    devicePixelRatio / backingStoreRatio

  hiDPICapable: -> window.devicePixelRatio? and window.devicePixelRatio isnt 1

  needsHiDPISwap: ->
    return false if @hiDPIDisabled() or !@hiDPICapable()
    @hiDPIReplacement() isnt null

  hiDPIReplacement: ->
    return null unless @image?
    @image.getAttribute 'data-caman-hidpi'

  replaceCanvas: (newCanvas) ->
    oldCanvas = @canvas
    @canvas = newCanvas
    @context = @canvas.getContext '2d'

    oldCanvas.parentNode.replaceChild @canvas, oldCanvas

    @width  = @canvas.width
    @height = @canvas.height

    @reloadCanvasData()

    @dimensions =
      width: @canvas.width
      height: @canvas.height

  # Begins the rendering process
  render: (callback = ->) ->
    Event.trigger @, "renderStart"
    
    @renderer.execute =>
      @context.putImageData @imageData, 0, 0
      callback.call @

  # Reverts the canvas back to it's original state while
  # maintaining any cropped or resized dimensions.
  revert: ->
    throw "Revert disabled" unless Caman.allowRevert

    @pixelData[i] = pixel for pixel, i in @originalVisiblePixels()
    @context.putImageData @imageData, 0, 0

  # Completely resets the canvas back to it's original state.
  # Any size adjustments will also be reset.
  reset: ->
    canvas = document.createElement('canvas')
    Util.copyAttributes(@canvas, canvas)

    canvas.width = @originalWidth
    canvas.height = @originalHeight

    ctx = canvas.getContext('2d')
    imageData = ctx.getImageData 0, 0, canvas.width, canvas.height
    pixelData = imageData.data

    pixelData[i] = pixel for pixel, i in @initializedPixelData

    ctx.putImageData imageData, 0, 0

    @cropCoordinates = x: 0, y: 0
    @resized = false

    @replaceCanvas(canvas)

  # Returns the original pixel data while maintaining any
  # cropping or resizing that may have occured.
  originalVisiblePixels: ->
    throw "Revert disabled" unless Caman.allowRevert

    pixels = []

    startX = @cropCoordinates.x
    endX = startX + @width
    startY = @cropCoordinates.y
    endY = startY + @height

    if @resized
      canvas = document.createElement('canvas')
      canvas.width = @originalWidth
      canvas.height = @originalHeight

      ctx = canvas.getContext('2d')
      imageData = ctx.getImageData 0, 0, canvas.width, canvas.height
      pixelData = imageData.data

      pixelData[i] = pixel for pixel, i in @originalPixelData

      ctx.putImageData imageData, 0, 0

      scaledCanvas = document.createElement('canvas')
      scaledCanvas.width = @width
      scaledCanvas.height = @height

      ctx = scaledCanvas.getContext('2d')
      ctx.drawImage canvas, 0, 0, @originalWidth, @originalHeight, 0, 0, @width, @height

      pixelData = ctx.getImageData(0, 0, @width, @height).data
      width = @width
    else
      pixelData = @originalPixelData
      width = @originalWidth

    for i in [0...pixelData.length] by 4
      coord = PixelInfo.locationToCoordinates(i, width)
      if (startX <= coord.x < endX) and (startY <= coord.y < endY)
        pixels.push pixelData[i], 
          pixelData[i+1],
          pixelData[i+2], 
          pixelData[i+3]

    pixels

  # Pushes the filter callback that modifies the RGBA object into the
  # render queue
  process: (name, processFn) ->
    @renderer.add
      type: Filter.Type.Single
      name: name
      processFn: processFn

    return @

  # Pushes the kernel into the render queue
  processKernel: (name, adjust, divisor, bias) ->
    if not divisor
      divisor = 0
      divisor += adjust[i] for i in [0...adjust.length]

    @renderer.add
      type: Filter.Type.Kernel
      name: name
      adjust: adjust
      divisor: divisor
      bias: bias or 0

    return @

  # Adds a standalone plugin into the render queue
  processPlugin: (plugin, args) ->
    @renderer.add
      type: Filter.Type.Plugin
      plugin: plugin
      args: args

    return @

  # Pushes a new layer operation into the render queue and calls the layer
  # callback
  newLayer: (callback) ->
    layer = new Layer @
    @canvasQueue.push layer
    @renderer.add type: Filter.Type.LayerDequeue

    callback.call layer

    @renderer.add type: Filter.Type.LayerFinished
    return @

  # Pushes the layer context and moves to the next operation
  executeLayer: (layer) -> @pushContext layer

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
