# Built-in layer blenders. Many of these mimic Photoshop blend modes.
class Caman.Blender
  @blenders = {}

  # Registers a blender. Can be used to add your own blenders outside of
  # the core library, if needed.

  # @param [String] name Name of the blender.
  # @param [Function] func The blender function.
  @register: (name, func) -> @blenders[name] = func

  # Executes a blender to combine a layer with its parent.
  
  # @param [String] name Name of the blending function to invoke.
  # @param [Object] rgbaLayer RGBA object of the current pixel from the layer.
  # @param [Object] rgbaParent RGBA object of the corresponding pixel in the parent layer.
  # @return [Object] RGBA object representing the blended pixel.
  @execute: (name, rgbaLayer, rgbaParent) ->
    @blenders[name](rgbaLayer, rgbaParent)

Blender = Caman.Blender