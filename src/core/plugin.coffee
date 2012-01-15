# Stores and registers standalone plugins
class Plugin
  @plugins = {}

  @register: (name, plugin) -> @plugins[name] = plugin
  @execute: (context, name) -> @plugins[name].call context

Caman.Plugin = Plugin