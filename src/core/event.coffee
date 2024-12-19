# Event system that can be used to register callbacks that get fired
# during certain times in the render process.
class Caman.Event
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

  # Trigger an event.
  # @param [Caman] target Instance of Caman emitting the event.
  # @param [String] type The event type.
  # @param [Object] data Extra data to send with the event.
  @trigger: (target, type, data = null) ->
    if @events[type] and @events[type].length
      for event in @events[type]
        if event.target is null or target.id is event.target.id
          event.fn.call target, data 
  
  # Listen for an event. Optionally bind the listen to a single instance
  # or all instances.
  #
  # @overload listen(target, type, fn)
  #   Listen for events emitted from a particular Caman instance.
  #   @param [Caman] target The instance to listen to.
  #   @param [String] type The type of event to listen for.
  #   @param [Function] fn The function to call when the event occurs.
  #
  # @overload listen(type, fn)
  #   Listen for an event from all Caman instances.
  #   @param [String] type The type of event to listen for.
  #   @param [Function] fn The function to call when the event occurs.
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

Event = Caman.Event