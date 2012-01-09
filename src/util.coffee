# DOM simplifier (no jQuery dependency)
$ = (sel, root = document) ->
  return sel if typeof sel is "object"
  root.querySelector sel
  
# Unique value utility
uniqid = do ->
  id = 0
  get: -> id++