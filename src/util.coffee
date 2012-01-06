# DOM simplifier (no jQuery dependency)
$ = (sel, root = document) ->
  return sel if typeof sel is "object"
  root.querySelector sel