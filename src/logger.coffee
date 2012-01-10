class Logger
  constructor: ->
    for name in ['log', 'info', 'warn', 'error']
      @[name] = do (name) ->
        ->
           window.console[name].apply console, arguments if window.console?

    @debug = @log

Log = new Logger()