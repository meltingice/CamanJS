class Store
  @items = {}
  
  @has: (search) -> @items[search]?
  @get: (search) -> @items[search]
  @execute: (search, callback) -> callback.call @get(search), @get(search)