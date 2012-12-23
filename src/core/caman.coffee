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
# This is also why this piece of code is a bit gross. Once everything is loaded, and Caman is 
# initialized, the callback function is fired.
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

  constructor: (args...) ->
    if @ instanceof Caman
      @parseArguments(args)
      @setup()

    else return new Caman(args)

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
    if typeof obj is "object"
      @initObj = obj
    else
      @initObj = $(obj)

    if Caman.NodeJS
      @initType = 'node'
    else
      @initType = obj.nodeName.toLowerCase()

  setup: ->
    switch @initType
      when "node" then @initNode()
      when "img" then @initImage()
      when "canvas" then @initCanvas()

  initNode: ->
    img = new Image()
    img.onload = @loadFinished
    img.onerror = (err) -> throw err
    img.src = @initObj

  initImage: ->
    @canvas = document.createElement 'canvas'
    Util.copyAttributes @initObj, @canvas, except: ['src']
    

  
