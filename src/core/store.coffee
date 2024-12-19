# Used for storing instances of CamanInstance objects such that, when Caman() is called on an 
# already initialized element, it returns that object instead of re-initializing.
class Caman.Store
  @items = {}
  
  @has: (search) -> @items[search]?
  @get: (search) -> @items[search]
  @put: (name, obj) -> @items[name] = obj
  @execute: (search, callback) ->
    setTimeout =>
      callback.call @get(search), @get(search)
    , 0

    return @get(search)
    
  @flush: (name = false) ->
    if name then delete @items[name] else @items = {}

Store = Caman.Store