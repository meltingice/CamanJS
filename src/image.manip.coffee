class Image extends Manip
  constructor: (@div, callback = ->) ->
    @image = $(@div)
    
    if @image?
      if @image.complete
        @finishInit()
      else
        @image.onload = => @finishInit()
      
  finishInit: ->
    canvas = document.createElement('canvas')
    