# Allows us to crop the canvas and produce a new smaller
# canvas.
Caman.Plugin.register "crop", (width, height, x = 0, y = 0) ->
  # Create our new canvas element
  if exports?
    canvas = new Canvas width, height
  else
    canvas = document.createElement 'canvas'
    canvas.width = width
    canvas.height = height

  ctx = canvas.getContext '2d'

  # Perform the cropping by drawing to the new canvas
  ctx.drawImage @canvas, x, y, width, height, 0, 0, width, height

  # Update all of the references
  @replaceCanvas canvas

Caman.Filter.register "crop", (width, height, x = 0, y = 0) ->
  @processPlugin "crop", Array.prototype.slice.call(arguments, 0)