{Module} = require 'coffeescript-module'
Renderer = require './renderer.coffee'

module.exports = class Context extends Module
  @aliasFunction 'reload', 'load'

  constructor: (@canvas) ->
    @context = @canvas.getContext '2d'
    @width = @canvas.width
    @height = @canvas.height
    @renderer = new Renderer(@)

    @load()

  load: ->
    @imageData = @context.getImageData 0, 0, @width, @height
    @pixelData = @imageData.data
