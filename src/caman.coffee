_ = require 'lodash'
RSVP = require 'rsvp'
{Module} = require 'coffeescript-module'

Context = require './caman/context.coffee'

module.exports = class Caman extends Module
  @Renderer: require('./caman/renderer.coffee')
  @Filter: require('./caman/filter.coffee')
  @Calculate: require('./caman/calculate.coffee')
  @Color: require('./caman/color.coffee')

  @extends require('./caman/init.coffee')

  DEFAULT_PIPELINE_OPTS =
    render: true

  constructor: (canvas) ->
    @context = new Context(canvas)
    
    Object.defineProperty @, 'canvas',
      enumerable: true
      get: => @context.canvas

  attach: (dest) ->
    dest = if typeof dest is "object" then dest else document.querySelector(dest)
    dest.parentNode.replaceChild @canvas, dest

  pipeline: (args...) ->
    if args.length is 1
      opts = DEFAULT_PIPELINE_OPTS
      func = args[0]
    else
      opts = _.merge {}, DEFAULT_PIPELINE_OPTS, args[0]
      func = args[1]

    func.call(@context.renderer)
    @render() if opts.render

  render: -> @context.renderer.render()

require('./caman-lib.coffee')(Caman)
