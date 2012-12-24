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
    release: "3.4.0"
    date: "12/17/12"

  # Debug mode enables console logging
  @DEBUG: false
  @NodeJS: exports?

  # Should we check the DOM for images with Caman instructions?
  @autoload: not Caman.NodeJS

  # Default cross-origin policy
  @crossOrigin: "anonymous"

  @toString: ->
    "Version " + Caman.version.release + ", Released " + Caman.version.date;

  @remoteProxy = ""

  constructor: ->
    throw "Invalid arguments" if arguments.length is 0

    if @ instanceof Caman
      args = arguments[0]

      # Every instance gets a unique ID. Makes it much simpler to check if two variables are the 
      # same instance.
      @id = Util.uniqid.get()
      @originalPixelData = []
      @pixelStack = []  # Stores the pixel layers
      @layerStack = []  # Stores all of the layers waiting to be rendered
      @canvasQueue = [] # Stores all of the canvases to be processed
      @currentLayer = null
      @scaled = false

      @analyze = new Analyze @
      @renderer = new Renderer @


      @parseArguments(args)
      @setup()

      return @
    else
      return new Caman(arguments)

  # All possible combinations:
  #
  # 1 argument
  #   - Image selector
  #   - Image object
  #   - Canvas selector
  #   - Canvas object
  # 2 arguments
  #   - Image selector + callback
  #   - Image object + callback
  #   - Canvas selector + URL
  #   - Canvas object + URL
  # 3 arguments
  #   - Canvas selector + URL + callback
  #   - Canvas object + URL + callback
  # NodeJS
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

  setInitObject: (obj) ->
    if Caman.NodeJS
      @initObj = obj
      @initType = 'node'
      return

    if typeof obj is "object"
      @initObj = obj
    else
      @initObj = $(obj)

    @initType = @initObj.nodeName.toLowerCase()

  setup: ->
    switch @initType
      when "node" then @initNode()
      when "img" then @initImage()
      when "canvas" then @initCanvas()

  initNode: ->
    @image = new Image()
    @image.onload = =>
      @canvas = new Canvas @image.width, @image.height
      @finishInit()

    @image.onerror = (err) -> throw err
    @image.src = @initObj

  initImage: ->
    @image = @initObj
    @canvas = document.createElement 'canvas'
    Util.copyAttributes @image, @canvas, except: ['src']
    
    @imageLoaded =>
      @canvas.width = @image.width
      @canvas.height = @image.height

      if @needsHiDPISwap()
        Log.debug @image.src, "->", @hiDPIReplacement()
        @image.src = @hiDPIReplacement()

        @imageLoaded =>
          Log.debug "HiDPI version loaded"
          @swapped = true
          @image.parentNode.replaceChild @canvas, @image
          @finishInit()
      else
        @image.parentNode.replaceChild @canvas, @image
        @finishInit()

  initCanvas: ->
    if @imageUrl?
      @image = document.createElement 'img'
      @image.src = @imageUrl
      @imageLoaded @finishInit
    else
      @finishInit()

  imageLoaded: (cb) ->
    if @image.complete
      cb()
    else
      @image.onload = cb

  finishInit: =>
    @assignId()

    @context = @canvas.getContext '2d'

    @originalWidth = @width = @canvas.width
    @originalHeight = @height = @canvas.height

    @hiDPIAdjustments()

    if @image?
      @context.drawImage @image, 
        0, 0, 
        @image.width, @image.height, 
        0, 0, 
        @originalWidth, @originalHeight
    
    @imageData = @context.getImageData 0, 0, @canvas.width, @canvas.height
    @pixelData = @imageData.data
    @originalPixelData.push pixel for pixel in @pixelData

    @dimensions =
      width: @canvas.width
      height: @canvas.height

    Store.put @getId, @

    @callback.call @,@

  assignId: ->
    return if Caman.NodeJS or @canvas.getAttribute 'data-caman-id'
    @canvas.setAttribute 'data-caman-id', @id

  getId: -> @canvas.getAttribute 'data-caman-id'

  hiDPIDisabled: ->
    @canvas.getAttribute('data-caman-hidpi-disabled') isnt null

  hiDPIAdjustments: ->
    return if Caman.NodeJS or @hiDPIDisabled()

    ratio = @hiDPIRatio()

    if ratio isnt 1
      Log.debug "HiDPI ratio = #{ratio}"
      @scaled = true

      @originalWidth = @canvas.width
      @originalHeight = @canvas.height

      @canvas.width = @originalWidth * ratio
      @canvas.height = @originalHeight * ratio
      @canvas.style.width = "#{@originalWidth}px"
      @canvas.style.height = "#{@originalHeight}px"

      @context.scale ratio, ratio

      @width = @canvas.width
      @height = @canvas.height

  hiDPIRatio: ->
    devicePixelRatio = window.devicePixelRatio or 1
    backingStoreRatio = @context.webkitBackingStorePixelRatio or
                        @context.mozBackingStorePixelRatio or
                        @context.msBackingStorePixelRatio or
                        @context.oBackingStorePixelRatio or
                        @context.backingStorePixelRatio or 1

    devicePixelRatio / backingStoreRatio

  needsHiDPISwap: ->
    return false if @hiDPIDisabled() or (window.devicePixelRatio or 1) is 1
    @hiDPIReplacement() isnt null

  hiDPIReplacement: ->
    return null unless @image?
    @image.getAttribute 'data-caman-hidpi'

  replaceCanvas: (newCanvas) ->
    oldCanvas = @canvas
    @canvas = newCanvas

    oldCanvas.parentNode.replaceChild @canvas, oldCanvas
    @finishInit()

  # Begins the rendering process
  render: (callback = ->) ->
    Event.trigger @, "renderStart"
    
    @renderer.execute =>
      @context.putImageData @imageData, 0, 0
      callback.call @

  # Reverts the canvas back to it's original state.
  # This used to be asynchronous, so we provide the option of
  # providing a callback to keep backwards compatibility.
  revert: (ready = ->) ->
    @pixelData[i] = pixel for pixel, i in @originalPixelData
    @context.putImageData @imageData, 0, 0
    ready.call @

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

    @renderer.add type: Filter.Type.Layerfinished
    return @

  # Pushes the layer context and moves to the next operation
  executeLayer: (layer) ->
    @pushContext layer
    @processNext()

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
