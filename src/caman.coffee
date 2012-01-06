# NodeJS compatibility
Root = if exports? then exports else window

# Here it begins. Caman is defined.
Root.Caman = ->  
  switch arguments.length
    when 1
      return Store.get(arguments[0]) if Store.has arguments[0]
      return new ManipImage(arguments)
    when 2
      return Store.execute arguments[0], arguments[1] if Store.has arguments[0]
      
      if typeof arguments[1] is 'function'
        tag = $(arguments[0]).nodeName.toLowerCase()
        return new ManipImage(arguments) if tag is "img"
        return new ManipCanvas(arguments) if tag is "canvas"
      else
        return new ManipCanvas(arguments)
    when 3
      return Store.execute arguments[1], arguments[2] if Store.has arguments[0]
      return new ManipCanvas(arguments)
    
Caman.version =
  release: "3.0"
  date: "1/2/12"