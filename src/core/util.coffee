# Look what you make me do Javascript
slice = Array::slice

# DOM simplifier (no jQuery dependency)
# NodeJS compatible
$ = (sel, root = document) ->
  return sel if typeof sel is "object" or exports?
  root.querySelector sel

class Util
  # Unique value utility
  @uniqid = do ->
    id = 0
    get: -> id++

  # Helper function that extends one object with all the properies of other objects
  @extend = (obj) ->
    dest = obj
    src = slice.call arguments, 1

    for copy in src
      for own prop of copy
        dest[prop] = copy[prop]

    return dest

  # In order to stay true to the latest spec, RGB values must be clamped between
  # 0 and 255. If we don't do this, weird things happen.
  @clampRGB = (val) ->
    return 0 if val < 0
    return 255 if val > 255
    val

  @copyAttributes: (from, to, opts={}) ->
    for attr in from.attributes
      continue if opts.except? and attr.nodeName in opts.except
      to.setAttribute(attr.nodeName, attr.nodeValue)

  # Support for browsers that don't know Uint8Array (such as IE9)
  @dataArray: (length = 0) ->
    return new Uint8Array(length) if Caman.NodeJS or window.Uint8Array?
    return new Array(length)