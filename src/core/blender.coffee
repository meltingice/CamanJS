class Blender
  @blenders = {}

  @register: (name, func) -> @blenders[name] = func
  @execute: (name, rgbaLayer, rgbaParent) ->
    @blenders[name](rgbaLayer, rgbaParent)