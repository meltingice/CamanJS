# Simple console logger class that can be toggled on and off based on Caman.DEBUG
class Logger
  constructor: ->
    for name in ['log', 'info', 'warn', 'error']
      @[name] = do (name) ->
        ->
          return if not Caman.DEBUG
          console[name].apply console, arguments

    @debug = @log

Log = new Logger()