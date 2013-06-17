# For the parts of this code adapted from http://arcturo.github.com/library/coffeescript/03_classes.html
# below is the required copyright notice.
#
# Copyright (c) 2011 Alexander MacCaw (info@eribium.org)
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
# LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  
moduleKeywords = ['extended', 'included']

class Module
  # Extend the base object itself like a static method
  @extends: (obj) ->
    for key, value of obj when key not in moduleKeywords
      @[key] = value

    obj.extended?.apply(@)
    @

  # Include methods on the object prototype
  @includes: (obj) ->
    for key, value of obj when key not in moduleKeywords
      # Assign properties to the prototype
      @::[key] = value

    obj.included?.apply(@)
    @

  # Add methods on this prototype that point to another method
  # on another object's prototype.
  @delegate: (args...) ->
    target = args.pop()
    @::[source] = target::[source] for source in args

  # Create an alias for a function
  @aliasFunction: (to, from) ->
    @::[to] = (args...) => @::[from].apply @, args

  # Create an alias for a property
  @aliasProperty: (to, from) ->
    Object.defineProperty @::, to,
      get: -> @[from]
      set: (val) -> @[from] = val

  # Execute a function in the context of the object, and pass
  # a reference to the object's prototype.
  @included: (func) -> func.call @, @::
  