# Responsible for storing all of the filters
Caman.Filter = class Filter
  # All of the different render operatives
  @Type =
    Single: 1
    Kernel: 2
    LayerDequeue: 3
    LayerFinished: 4
    LoadOverlay: 5
    Plugin: 6

  # Registers a filter function
  @register: (name, filterFunc) -> Caman::[name] = filterFunc