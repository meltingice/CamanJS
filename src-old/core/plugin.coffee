# Stores and registers standalone plugins
class Caman.Plugin
  @plugins = {}

  @register: (name, plugin) -> @plugins[name] = plugin
  @execute: (context, name, args) -> @plugins[name].apply context, args

Plugin = Caman.Plugin