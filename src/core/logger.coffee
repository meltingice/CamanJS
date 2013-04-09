# Simple console logger class that can be toggled on and off based on Caman.DEBUG
class Logger
  constructor: ->
    for name in ['log', 'info', 'warn', 'error']
      @[name] = do (name) ->
        (args...) ->
          return if not Caman.DEBUG
          try
            console[name].apply console, args
          catch e
            # We're probably using IE9 or earlier
            console[name] args

    @debug = @log

Log = new Logger()