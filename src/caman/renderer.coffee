module.exports = class Renderer
  @filter: (processName, processFunc) ->
    @::[processName] = (args...) ->
      @enqueue processFunc.apply(@, args)

  constructor: (@context) ->
    @renderQueue = []

  enqueue: (item) ->
    @renderQueue.push item

  render: ->
    console.log @renderQueue

