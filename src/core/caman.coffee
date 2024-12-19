# NodeJS compatibility
if exports?
  Root = exports
  Canvas = require 'canvas'
  Image = Canvas.Image

  Fiber = require 'fibers'

  fs = require 'fs'
  http = require 'http'
else
  Root = window

# Here it begins. Caman is defined.
# There are many different initialization for Caman, which are described on the 
# [Guides](http://camanjs.com/guides).
#
# Initialization is tricky because we need to make sure everything we need is actually fully 
# loaded in the DOM before proceeding. When initialized on an image, we need to make sure that the 
# image is done loading before converting it to a canvas element and writing the pixel data. If we 
# do this prematurely, the browser will throw a DOM Error, and chaos will ensue. In the event that 
# we initialize Caman on a canvas element while specifying an image URL, we need to create a new 
# image element, load the image, then continue with initialization.
# 
# The main goal for Caman was simplicity, so all of this is handled transparently to the end-user. 
class Caman extends Module
  # The current version.
  @version:
    release: "4.1.2"
    date: "7/27/2013"

  # @property [Boolean] Debug mode enables console logging.
  @DEBUG: false

  # @property [Boolean] Allow reverting the canvas?
  #   If your JS process is running out of memory, disabling
  #   this could help drastically.
  @allowRevert: true

  # @property [String] Default cross-origin policy.
  @crossOrigin: "anonymous"

  # @property [String] Set the URL of the image proxy script.
  @remoteProxy: ""

  # @proparty [String] The GET param used with the proxy script.
  @proxyParam: "camanProxyUrl"

  # @property [Boolean] Are we in a NodeJS environment?
  @NodeJS: exports?

  # @property [Boolean] Should we check the DOM for images with Caman instructions?
  @autoload: not Caman.NodeJS

  # Custom toString()
  # @return [String] Version and release information.
  @toString: ->
    "Version " + Caman.version.release + ", Released " + Caman.version.date;

  # Get the ID assigned to this canvas by Caman.
  # @param [DOMObject] canvas The canvas to inspect.
  # @return [String] The Caman ID associated with this canvas.
  @getAttrId: (canvas) ->
    return true if Caman.NodeJS

    if typeof canvas is "string"
      canvas = $(canvas)

    return null unless canvas? and canvas.getAttribute?
    canvas.getAttribute 'data-caman-id'

  # The Caman function. While technically a constructor, it was made to be called without
  # the `new` keyword. Caman will figure it out.
  # 
  # @param [DOMObject, String] initializer The DOM selector or DOM object to initialize.
  # @overload Caman(initializer)
  #   Initialize Caman without a callback.
  # 
  # @overload Caman(initializer, callback)
  #   Initialize Caman with a callback.
  #   @param [Function] callback Function to call once initialization completes.
  # 
  # @overload Caman(initializer, url)
  #   Initialize Caman with a URL to an image and no callback.
  #   @param [String] url URl to an image to draw to the canvas.
  # 
  # @overload Caman(initializer, url, callback)
  #   Initialize Caman with a canvas, URL to an image, and a callback.
  #   @param [String] url URl to an image to draw to the canvas.
  #   @param [Function] callback Function to call once initialization completes.
  # 
  # @overload Caman(file)
  #   **NodeJS**: Initialize Caman with a path to an image file and no callback.
  #   @param [String, File] file File object or path to image to read.
  # 
  # @overload Caman(file, callback)
  #   **NodeJS**: Initialize Caman with a file and a callback.
  #   @param [String, File] file File object or path to image to read.
  #   @param [Function] callback Function to call once initialization completes.
  # 
  # @return [Caman] Initialized Caman instance.
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

  # Checks to ensure the DOM is loaded. Ensures the callback is always fired, even
  # if the DOM is already loaded before it's invoked. The callback is also always
  # called asynchronously.
  # 
  # @param [Function] cb The callback function to fire when the DOM is ready.
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

  # Parses the arguments given to the Caman function, and sets the appropriate
  # properties on this instance.
  #
  # @params [Array] args Array of arguments passed to Caman.
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

  # Sets the initialization object for this instance.
  #
  # @param [Object, String] obj The initialization argument.
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

  # Begins the setup process, which differs depending on whether we're in NodeJS,
  # or if an image or canvas object was provided.
  setup: ->
    switch @initType
      when "node" then @initNode()
      when "img" then @initImage()
      when "canvas" then @initCanvas()

  # Initialization function for NodeJS.
  initNode: ->
    Log.debug "Initializing for NodeJS"

    if typeof @initObj is "string" and @initObj.match(/^https?:\/\//)
      @readFromHttp @initObj, @nodeFileReady
    else if typeof @initObj is "string"
      fs.readFile @initObj, @nodeFileReady
    else
      @nodeFileReady null, @initObj

  readFromHttp: (url, callback) ->
    Log.debug "Fetching image from #{url}"

    req = http.get url, (res) ->
      buf = ''
      res.setEncoding('binary')
      res.on 'data', (chunk) ->
        buf += chunk
      res.on 'end', ->
        callback null, new Buffer(buf, 'binary');
    req.on 'error', callback

  nodeFileReady: (err, data) =>
    throw err if err

    @image = new Image()
    @image.src = data

    Log.debug "Image loaded. Width = #{@imageWidth()}, Height = #{@imageHeight()}"
    @canvas = new Canvas @imageWidth(), @imageHeight()
    @finishInit()

  # Initialization function for the browser and image objects.
  initImage: ->
    @image = @initObj
    @canvas = document.createElement 'canvas'
    @context = @canvas.getContext '2d'
    Util.copyAttributes @image, @canvas, except: ['src']

    # Swap out the image with the canvas element if the image exists
    # in the DOM.
    @image.parentNode.replaceChild @canvas, @image if @image.parentNode?

    @imageAdjustments()
    @waitForImageLoaded()

  # Initialization function for the browser and canvas objects.
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

  # Automatically check for a HiDPI capable screen and swap out the image if possible.
  # Also checks the image URL to see if it's a cross-domain request, and attempt to
  # proxy the image. If a cross-origin type is configured, the proxy will be ignored.
  imageAdjustments: ->
    if @needsHiDPISwap()
      Log.debug @image.src, "->", @hiDPIReplacement()

      @swapped = true
      @image.src = @hiDPIReplacement()

    if IO.isRemote(@image)
      @image.src = IO.proxyUrl(@image.src)
      Log.debug "Remote image detected, using URL = #{@image.src}"

  # Utility function that fires {Caman#imageLoaded} once the image is finished loading.
  waitForImageLoaded: ->
    if @isImageLoaded()
      @imageLoaded()
    else
      @image.onload = @imageLoaded

  # Checks if the given image is finished loading.
  # @return [Boolean] Is the image loaded?
  isImageLoaded: ->
    return false unless @image.complete

    # Internet Explorer is weird.
    return false if @image.naturalWidth? and @image.naturalWidth is 0
    return true

  # Internet Explorer has issues figuring out image dimensions when they aren't
  # explicitly defined, apparently. We check the normal width/height properties first,
  # but fall back to natural sizes if they are 0.
  # @return [Number] Width of the initialization image.
  imageWidth: -> @image.width or @image.naturalWidth

  # @see Caman#imageWidth
  # @return [Number] Height of the initialization image.
  imageHeight: -> @image.height or @image.naturalHeight

  # Function that is called once the initialization image is finished loading.
  # We make sure that the canvas dimensions are properly set here.
  imageLoaded: ->
    Log.debug "Image loaded. Width = #{@imageWidth()}, Height = #{@imageHeight()}"

    if @swapped
      @canvas.width = @imageWidth() / @hiDPIRatio()
      @canvas.height = @imageHeight() / @hiDPIRatio()
    else
      @canvas.width = @imageWidth()
      @canvas.height = @imageHeight()

    @finishInit()

  # Final step of initialization. We finish setting up our canvas element, and we
  # draw the image to the canvas (if applicable).
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
    
    @imageData = @context.getImageData 0, 0, @canvas.width, @canvas.height
    @pixelData = @imageData.data
    
    if Caman.allowRevert
      @initializedPixelData = Util.dataArray(@pixelData.length)
      @originalPixelData = Util.dataArray(@pixelData.length)

      for pixel, i in @pixelData
        @initializedPixelData[i] = pixel
        @originalPixelData[i] = pixel

    @dimensions =
      width: @canvas.width
      height: @canvas.height

    Store.put @id, @ unless Caman.NodeJS

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

  # Reset the canvas pixels to the original state at initialization.
  resetOriginalPixelData: ->
    throw "Revert disabled" unless Caman.allowRevert

    @originalPixelData = Util.dataArray(@pixelData.length)
    @originalPixelData[i] = pixel for pixel, i in @pixelData

  # Does this instance have an ID assigned?
  # @return [Boolean] Existance of an ID.
  hasId: -> Caman.getAttrId(@canvas)?

  # Assign a unique ID to this instance.
  assignId: ->
    return if Caman.NodeJS or @canvas.getAttribute 'data-caman-id'
    @canvas.setAttribute 'data-caman-id', @id

  # Is HiDPI support disabled via the HTML data attribute?
  # @return [Boolean]
  hiDPIDisabled: ->
    @canvas.getAttribute('data-caman-hidpi-disabled') isnt null

  # Perform HiDPI adjustments to the canvas. This consists of changing the
  # scaling and the dimensions to match that of the display.
  hiDPIAdjustments: ->
    return if Caman.NodeJS or !@needsHiDPISwap()

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

  # Calculate the HiDPI ratio of this display based on the backing store
  # and the pixel ratio.
  # @return [Number] The HiDPI pixel ratio.
  hiDPIRatio: ->
    devicePixelRatio = window.devicePixelRatio or 1
    backingStoreRatio = @context.webkitBackingStorePixelRatio or
                        @context.mozBackingStorePixelRatio or
                        @context.msBackingStorePixelRatio or
                        @context.oBackingStorePixelRatio or
                        @context.backingStorePixelRatio or 1

    devicePixelRatio / backingStoreRatio

  # Is this display HiDPI capable?
  # @return [Boolean]
  hiDPICapable: -> window.devicePixelRatio? and window.devicePixelRatio isnt 1

  # Do we need to perform an image swap with a HiDPI image?
  # @return [Boolean]
  needsHiDPISwap: ->
    return false if @hiDPIDisabled() or !@hiDPICapable()
    @hiDPIReplacement() isnt null

  # Gets the HiDPI replacement for the initialization image.
  # @return [String] URL to the HiDPI version.
  hiDPIReplacement: ->
    return null unless @image?
    @image.getAttribute 'data-caman-hidpi'

  # Replaces the current canvas with a new one, and properly updates all of the
  # applicable references for this instance.
  #
  # @param [DOMObject] newCanvas The canvas to swap into this instance.
  replaceCanvas: (newCanvas) ->
    oldCanvas = @canvas
    @canvas = newCanvas
    @context = @canvas.getContext '2d'


    oldCanvas.parentNode.replaceChild @canvas, oldCanvas if !Caman.NodeJS
    
    @width  = @canvas.width
    @height = @canvas.height

    @reloadCanvasData()

    @dimensions =
      width: @canvas.width
      height: @canvas.height

  # Begins the rendering process. This will execute all of the filter functions
  # called either since initialization or the previous render.
  #
  # @param [Function] callback Function to call when rendering is finished.
  render: (callback = ->) ->
    Event.trigger @, "renderStart"
    
    @renderer.execute =>
      @context.putImageData @imageData, 0, 0
      callback.call @

  # Reverts the canvas back to it's original state while
  # maintaining any cropped or resized dimensions.
  #
  # @param [Boolean] updateContext Should we apply the reverted pixel data to the
  #   canvas context thus triggering a re-render by the browser?
  revert: (updateContext = true) ->
    throw "Revert disabled" unless Caman.allowRevert

    @pixelData[i] = pixel for pixel, i in @originalVisiblePixels()
    @context.putImageData @imageData, 0, 0 if updateContext

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
  # **Warning**: this is currently in beta status.
  #
  # @return [Array] Original pixel values still visible after cropping or resizing.
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
      coord = Pixel.locationToCoordinates(i, width)
      if (startX <= coord.x < endX) and (startY <= coord.y < endY)
        pixels.push pixelData[i], 
          pixelData[i+1],
          pixelData[i+2], 
          pixelData[i+3]

    pixels

  # Pushes the filter callback that modifies the RGBA object into the
  # render queue.
  #
  # @param [String] name Name of the filter function.
  # @param [Function] processFn The Filter function.
  # @return [Caman]
  process: (name, processFn) ->
    @renderer.add
      type: Filter.Type.Single
      name: name
      processFn: processFn

    return @

  # Pushes the kernel into the render queue.
  #
  # @param [String] name The name of the kernel.
  # @param [Array] adjust The convolution kernel represented as a 1D array.
  # @param [Number] divisor The divisor for the convolution.
  # @param [Number] bias The bias for the convolution.
  # @return [Caman]
  processKernel: (name, adjust, divisor = null, bias = 0) ->
    unless divisor?
      divisor = 0
      divisor += adjust[i] for i in [0...adjust.length]

    @renderer.add
      type: Filter.Type.Kernel
      name: name
      adjust: adjust
      divisor: divisor
      bias: bias

    return @

  # Adds a standalone plugin into the render queue.
  #
  # @param [String] plugin Name of the plugin.
  # @param [Array] args Array of arguments to pass to the plugin.
  # @return [Caman]
  processPlugin: (plugin, args) ->
    @renderer.add
      type: Filter.Type.Plugin
      plugin: plugin
      args: args

    return @

  # Pushes a new layer operation into the render queue and calls the layer
  # callback.
  #
  # @param [Function] callback Function that is executed within the context of the layer.
  #   All filter and adjustment functions for the layer will be executed inside of this function.
  # @return [Caman]
  newLayer: (callback) ->
    layer = new Layer @
    @canvasQueue.push layer
    @renderer.add type: Filter.Type.LayerDequeue

    callback.call layer

    @renderer.add type: Filter.Type.LayerFinished
    return @

  # Pushes the layer context and moves to the next operation.
  # @param [Layer] layer The layer to execute.
  executeLayer: (layer) -> @pushContext layer

  # Set all of the relevant data to the new layer.
  # @param [Layer] layer The layer whose context we want to switch to.
  pushContext: (layer) ->
    @layerStack.push @currentLayer
    @pixelStack.push @pixelData
    @currentLayer = layer
    @pixelData = layer.pixelData

  # Restore the previous layer context.
  popContext: ->
    @pixelData = @pixelStack.pop()
    @currentLayer = @layerStack.pop()

  # Applies the current layer to its parent layer.
  applyCurrentLayer: -> @currentLayer.applyToParent()

Root.Caman = Caman
