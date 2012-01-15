# This is the main class that you interact with once Caman is actaully initialized.
# It stores all of the important data relevant to a Caman-initialized canvas, and is also 
# responsible for the actual initialization.
class CamanInstance
  @Type =
    Image: 1
    Canvas: 2

  @toString = Caman.toString
    
  # All of the arguments given to the Caman() function are simply thrown here.
  constructor: (args, type = CamanInstance.Type.Canvas) ->
    # Every instance gets a unique ID. Makes it much simpler to check if two variables are the 
    # same instance.
    @id = uniqid.get()

    # Stores the pixel layers
    @pixelStack = []

    # Stores all of the layers waiting to be rendered
    @layerStack = []

    # Stores all of the render operatives
    @renderQueue = []

    # Stores all of the canvases to be processed
    @canvasQueue = []
  
    # Begin initialization
    switch type
      when CamanInstance.Type.Image then @loadImage.apply @, args
      when CamanInstance.Type.Canvas then @loadCanvas.apply @, args
      
  ########## Begin Image Loading ##########
  
  loadImage: (id, callback = ->) ->   
    if typeof id is "object" and id.nodeName?.toLowerCase() is "img"
      element = id
      
      if id.id
        id = element.id
      else
        id = "caman-#{uniqid.get()}"
        element.id = id
        
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
        
  imageLoaded: (id, image, callback) ->
    @image = image
    
    @canvas = document.createElement 'canvas'
    @canvas.id = image.id
    
    for attr in ['data-camanwidth', 'data-camanheight']
      @canvas.setAttribute attr, @image.getAttribute(attr) if @image.getAttribute attr
    
    image.parentNode.replaceChild @canvas, @image
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
        id = "caman-#{uniqid.get()}"
        element.id = id
        
    if $(id)?
      @canvasLoaded url, id, callback
    else
      document.addEventListener "DOMContentLoaded", =>
        @canvasLoaded url, id, callback
      , false
      
  canvasLoaded: (url, id, callback) ->
    @canvas = $(id)
    
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
    