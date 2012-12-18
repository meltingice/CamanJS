# Event system that can be used to register callbacks that get fired
# during certain times in the render process.
class Event
  @events = {}

  # All of the supported event types
  @types = [
    "processStart"
    "processComplete"
    "renderStart"
    "renderFinished"
    "blockStarted"
    "blockFinished"
  ]

  # Trigger an event
  @trigger: (target, type, data) ->
    if @events[type] and @events[type].length
      for event in @events[type]
        if event.target is null or target.id is event.target.id
          event.fn.call target, data 
  
  # Listen for an event. Optionally bind the listen to a single CamanInstance
  # or all CamanInstances.
  @listen: (target, type, fn) ->
    # Adjust arguments if target is omitted
    if typeof target is "string"
      _type = target
      _fn = type

      target = null
      type = _type
      fn = _fn

    # Validation
    return false if type not in @types

    @events[type] = [] if not @events[type]
    @events[type].push target: target, fn: fn

    return true

Caman.Event = Event