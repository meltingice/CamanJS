# This is the main class that you interact with once Caman is actaully initialized.
# It stores all of the important data relevant to a Caman-initialized canvas, and is also 
# responsible for the actual initialization.
class CamanInstance
  @Type =
    Image: 1
    Canvas: 2
    Unknown: 3
    Node: 4

  @toString = Caman.toString
    
  # All of the arguments given to the Caman() function are simply thrown here.
  constructor: (args, type = CamanInstance.Type.Canvas) ->
    # Every instance gets a unique ID. Makes it much simpler to check if two variables are the 
    # same instance.
    @id = Util.uniqid.get()

    # Stores the pixel layers
    @pixelStack = []

    # Stores all of the layers waiting to be rendered
    @layerStack = []

    # Stores all of the render operatives
    @renderQueue = []

    # Stores all of the canvases to be processed
    @canvasQueue = []

    @currentLayer = null
  
    # Begin initialization
    switch type
      when CamanInstance.Type.Image then @loadImage.apply @, args
      when CamanInstance.Type.Canvas then @loadCanvas.apply @, args
      when CamanInstance.Type.Node then @loadNode.apply @, args
      when CamanInstance.Type.Unknown
        if $(args[0])
          @loadUnknown args
        else
          if document.readyState is "complete"
            throw "Could not find element of id #{id}"
          
          document.addEventListener "DOMContentLoaded", =>
            @loadUnknown args
          , false

  loadUnknown: (args) ->
    e = $(args[0])
    switch e.nodeName.toLowerCase()
      when "img" then @loadImage.apply @, args
      when "canvas" then @loadCanvas(null, args[0], args[1])
      
  ########## Begin Image Loading ##########
  
  loadImage: (id, callback = ->) ->   
    if typeof id is "object" and id.nodeName?.toLowerCase() is "img"
      element = id
      
      if id.id
        id = element.id
      else
        id = "caman-#{Util.uniqid.get()}"
        element.id = id

      return @imageLoaded(id, element, callback) if element.complete
        
    if $(id)?
      image = $(id)
      proxyURL = IO.remoteCheck image.src

      if proxyURL
        image.onload = => @imageLoaded id, image, callback
        image.src = proxyURL
      else
        if image.complete
          @imageLoaded id, image, callback
        else
          image.onload = => @imageLoaded id, image, callback
    else
      if document.readyState is "complete"
        throw "Could not find element of id #{id}"
      
      document.addEventListener "DOMContentLoaded",  =>
        @imageLoaded id, $(id), callback
      , false
        
  imageLoaded: (id, image, callback) ->
    @image = image

    if not image or image.nodeName.toLowerCase() isnt "img"
      throw "Given element ID isn't an image: #{id}"
    
    @canvas = document.createElement 'canvas'
    @canvas.id = image.id
    
    for attr in ['data-camanwidth', 'data-camanheight']
      @canvas.setAttribute attr, @image.getAttribute(attr) if @image.getAttribute attr
    

    image.parentNode.replaceChild @canvas, @image if image.parentNode?
    
    @canvasID = id
    @options =
      canvas: id
      image: @image.src
      
    @finishInit callback

  ########## End Image Loading ##########
  
  ########## Begin Canvas Loading ##########
  
  loadCanvas: (url, id, callback = ->) ->
    if typeof id is "object" and id.nodeName?.toLowerCase() is "canvas"
      element = id
      
      if id.id
        id = element.id
      else
        id = "caman-#{Util.uniqid.get()}"
        element.id = id
        
    if $(id)?
      @canvasLoaded url, id, callback
    else
      if document.readyState is "complete"
        throw "Could not find element of id #{id}"

      document.addEventListener "DOMContentLoaded", =>
        @canvasLoaded url, id, callback
      , false
      
  canvasLoaded: (url, id, callback) ->
    @canvas = $(id)

    if not $(id) or $(id).nodeName.toLowerCase() isnt "canvas"
      throw "Given element ID isn't a canvas: #{id}"
    
    if url?
      @image = document.createElement 'img'
      @image.onload = => @finishInit callback
      
      proxyURL = IO.remoteCheck(url)
      
      @canvasID = id
      @options =
        canvas: id
        image: url
        
      @image.src = if proxyURL then proxyURL else url
    else
      @finishInit callback
  
  ########## End Canvas Loading ##########

  loadNode: (file, callback) ->
    img = new Image()
    file = fs.realpathSync file

    img.onload = =>
      @canvasID = Util.uniqid.get()
      @canvas = new Canvas img.width, img.height
      
      context = @canvas.getContext '2d'
      context.drawImage img, 0, 0

      @finishInit callback

    img.onerror = (err) ->
      throw err

    img.src = file
    
  finishInit: (callback) ->
    @context = @canvas.getContext("2d")
    
    if @image?
      oldWidth = @image.width
      oldHeight = @image.height
      newWidth = @canvas.getAttribute 'data-camanwidth'
      newHeight = @canvas.getAttribute 'data-camanheight'

      # Image resizing
      if newWidth or newHeight
        if newWidth
          @image.width = parseInt newWidth, 10

          if newHeight
            @image.height = parseInt newHeight, 10
          else
            @image.height = @image.width * oldHeight / oldWidth
        else if newHeight
          @image.height = parseInt newHeight, 10
          @image.width = @image.height * oldWidth / oldHeight

      @canvas.width = @image.width
      @canvas.height = @image.height
      
      @context.drawImage(@image, 0, 0, @image.width, @image.height)
      
    @imageData = @context.getImageData(0, 0, @canvas.width, @canvas.height)
    @pixelData = @imageData.data
    
    @dimensions =
      width: @canvas.width
      height: @canvas.height
      
    Store.put @canvasID, @
    
    # haha, owl face.
    callback.call @,@
    return @
    