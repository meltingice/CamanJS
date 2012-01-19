# Stores and registers standalone plugins
class Plugin
  @plugins = {}

  @register: (name, plugin) -> @plugins[name] = plugin
  @execute: (context, name, args) -> @plugins[name].apply context, args

Caman.Plugin = Plugin