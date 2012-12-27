# Built-in layer blenders. Many of these mimic Photoshop blend modes.
Caman.Blender = class Blender
  @blenders = {}

  # Registers a blender. Can be used to add your own blenders outside of
  # the core library, if needed.
  @register: (name, func) -> @blenders[name] = func

  # Executes a blender to combine a layer with its parent.
  @execute: (name, rgbaLayer, rgbaParent) ->
    @blenders[name](rgbaLayer, rgbaParent)