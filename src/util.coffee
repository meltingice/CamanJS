# Look what you make me do Javascript
slice = Array::slice

extend = (obj) ->
  dest = obj
  src = slice.call arguments, 1

  for copy in src
    for own prop of copy
      dest[prop] = copy[prop]

  return dest

# DOM simplifier (no jQuery dependency)
$ = (sel, root = document) ->
  return sel if typeof sel is "object"
  root.querySelector sel
  
# Unique value utility
uniqid = do ->
  id = 0
  get: -> id++

clampRGB = (val) ->
  return 0 if val < 0
  return 255 if val > 255
  val