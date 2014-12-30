Caman.Plugin.register "rotate", (degrees) ->
  angle = degrees%360
  if angle == 0 
    return @dimensions =
      width: @canvas.width
      height: @canvas.height 
  to_radians = Math.PI/180;
 
  if exports?
    canvas = new Canvas()
  else
    canvas = document.createElement 'canvas'  
    Util.copyAttributes @canvas, canvas
  
  if angle == 90 or angle == -270 or angle == 270 or angle == -90
    width = @canvas.height
    height = @canvas.width
    x = width/2
    y = height/2
  else if angle == 180
    width = @canvas.width
    height = @canvas.height
    x = width/2
    y = height/2 
  else 
    width = Math.sqrt(Math.pow(@originalWidth, 2) + Math.pow(@originalHeight, 2))
    height = width
    x = @canvas.height/2
    y = @canvas.width/2
  
  canvas.width = width
  canvas.height = height
  ctx = canvas.getContext '2d'
  ctx.save()
  ctx.translate x, y	
  ctx.rotate angle*to_radians
  ctx.drawImage @canvas, -@canvas.width/2, -@canvas.height/2, @canvas.width, @canvas.height
  ctx.restore()

  @rotationAngle += degrees
  @rotated = true

  @replaceCanvas canvas

Caman.Filter.register "rotate", ->
  @processPlugin "rotate", Array.prototype.slice.call(arguments, 0)
