# Allows us to crop the canvas and produce a new smaller
# canvas.
Caman.Plugin.register "crop", (width, height, x = 0, y = 0) ->
  # Create our new canvas element
  if exports?
    canvas = new Canvas width, height
  else
    canvas = document.createElement 'canvas'
    Util.copyAttributes @canvas, canvas

    canvas.width = width
    canvas.height = height

  ctx = canvas.getContext '2d'

  # Perform the cropping by drawing to the new canvas
  ctx.drawImage @canvas, x, y, width, height, 0, 0, width, height

  @cropCoordinates = x: x, y: y

  # Update all of the references
  @cropped = true
  @replaceCanvas canvas

# Resize the canvas and the image to a new size
Caman.Plugin.register "resize", (newDims = null) ->
  # Calculate new size
  if newDims is null or (!newDims.width? and !newDims.height?)
    Log.error "Invalid or missing dimensions given for resize"
    return

  if not newDims.width?
    # Calculate width
    newDims.width = @canvas.width * newDims.height / @canvas.height
  else if not newDims.height?
    # Calculate height
    newDims.height = @canvas.height * newDims.width / @canvas.width

  if exports?
    canvas = new Canvas newDims.width, newDims.height
  else
    canvas = document.createElement 'canvas'
    Util.copyAttributes @canvas, canvas

    canvas.width = newDims.width
    canvas.height = newDims.height

  ctx = canvas.getContext '2d'

  ctx.drawImage @canvas, 
    0, 0, 
    @canvas.width, @canvas.height, 
    0, 0, 
    newDims.width, newDims.height

  @resized = true
  @replaceCanvas canvas

Caman.Filter.register "crop", ->
  @processPlugin "crop", Array.prototype.slice.call(arguments, 0)

Caman.Filter.register "resize", ->
  @processPlugin "resize", Array.prototype.slice.call(arguments, 0)