# NodeJS compatibility
Root = if exports? then exports else window

# Here it begins. Caman is defined.
Root.Caman = ->  
  switch arguments.length
    when 1
      return Store.get(arguments[0]) if Store.has arguments[0]
      return new CamanInstance arguments, CamanInstance.Type.Image
    when 2
      return Store.execute arguments[0], arguments[1] if Store.has arguments[0]
      
      if typeof arguments[1] is 'function'
        tag = $(arguments[0]).nodeName.toLowerCase()
        return new CamanInstance(arguments, CamanInstance.Type.Image) if tag is "img"
        return new CamanInstance(arguments, CamanInstance.Type.Canvas) if tag is "canvas"
      else
        return new CamanInstance(arguments, CamanInstance.Type.Canvas)
    when 3
      return Store.execute arguments[1], arguments[2] if Store.has arguments[0]
      return new CamanInstance(arguments, CamanInstance.Type.Canvas)
    
Caman.version =
  release: "3.0"
  date: "1/2/12"

Caman.DEBUG = false

Caman.toString = ->
  "Version " + Caman.version.release + ", Released " + Caman.version.date;

Caman.remoteProxy = ""