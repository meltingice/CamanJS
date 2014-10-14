{Module} = require 'coffeescript-module'
Renderer = require './renderer.coffee'

module.exports = class Context extends Module
  @aliasFunction 'reload', 'load'

  constructor: (@canvas) ->
    @context = @canvas.getContext '2d'
    @width = @canvas.width
    @height = @canvas.height
    @load()
    
    @renderer = new Renderer(@)

  load: ->
    @imageData = @context.getImageData 0, 0, @width, @height
    @pixelData = @imageData.data

  update: ->
    @context.putImageData @imageData, 0, 0
