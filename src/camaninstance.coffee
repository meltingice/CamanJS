class CamanInstance
	@Type =
		Image: 1
		Canvas: 2
		
	constructor: (args, type = CamanInstance.Type.Canvas) ->
		@pixelStack = []
		@layerStack = []
		@renderQueue = []
	
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
			# TODO: proxy
			
			if image.complete
				@imageLoaded id, image, callback
			else
				image.onload = => @imageLoaded id, image, callback
				
	imageLoaded: (id, image, callback) ->
		@image = image
		
		@canvas = document.creatElement 'canvas'
		@canvas.id = image.id
		
		# TODO: resize options
		
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
			
			# TODO: proxy
			@canvasID = id
			@options =
				canvas: id
				image: url
				
			@image.src = url
		else
			@finishInit callback
	
	########## End Canvas Loading ##########
		
	finishInit: (callback) ->
		@context = @canvas.getContext("2d")
		
		if @image?
			# TODO: resize options
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
		