# NodeJS compatibility
if exports?
  Root = exports
  Canvas = require 'canvas'
  Image = Canvas.Image

  fs = require 'fs'
else
  Root = window

# Here it begins. Caman is defined.
# There are many different initialization for Caman, which are described on the 
# [Basic Usage](http://camanjs.com/docs) page.
#
# Initialization is tricky because we need to make sure everything we need is actually fully 
# loaded in the DOM before proceeding. When initialized on an image, we need to make sure that the 
# image is done loading before converting it to a canvas element and writing the pixel data. If we 
# do this prematurely, the browser will throw a DOM Error, and chaos will ensue. In the event that 
# we initialize Caman on a canvas element while specifying an image URL, we need to create a new 
# image element, load the image, then continue with initialization.
#
# The main goal for Caman was simplicity, so all of this is handled transparently to the end-user. 
# This is also why this piece of code is a bit gross. Once everything is loaded, and Caman is 
# initialized, the callback function is fired.
Root.Caman = Caman = ->
  # NodeJS version
  return new CamanInstance arguments, CamanInstance.Type.Node if exports?

  switch arguments.length
    when 1
      return Store.get(arguments[0]) if Store.has arguments[0]
      return new CamanInstance arguments, CamanInstance.Type.Image
    when 2
      return Store.execute arguments[0], arguments[1] if Store.has arguments[0]
      
      if typeof arguments[1] is 'function'
        return new CamanInstance(arguments, CamanInstance.Type.Unknown)
      else
        return new CamanInstance(arguments, CamanInstance.Type.Canvas)
    when 3
      return Store.execute arguments[1], arguments[2] if Store.has arguments[0]
      return new CamanInstance(arguments, CamanInstance.Type.Canvas)
    
Caman.version =
  release: "3.0"
  date: "1/18/12"

# Debug mode enables console logging
Caman.DEBUG = false

Caman.toString = ->
  "Version " + Caman.version.release + ", Released " + Caman.version.date;

Caman.remoteProxy = ""
Caman.Util = Util