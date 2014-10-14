# Responsible for registering and storing all of the filters.
class Caman.Filter
  # All of the different render operatives
  @Type =
    Single: 1
    Kernel: 2
    LayerDequeue: 3
    LayerFinished: 4
    LoadOverlay: 5
    Plugin: 6

  # Registers a filter function.
  # @param [String] name The name of the filter.
  # @param [Function] filterFunc The filter function.
  @register: (name, filterFunc) -> Caman::[name] = filterFunc

Filter = Caman.Filter