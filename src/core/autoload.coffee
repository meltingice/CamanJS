Caman.DOMUpdated = ->
  imgs = document.querySelectorAll("img[data-caman]")
  return unless imgs.length > 0

  for img in imgs
    parser = new CamanParser img, ->
      @parse()
      @execute()

# If enabled, we check the page to see if there are any
# images with Caman instructions provided using HTML5
# data attributes.
if Caman.autoload then do ->
  if document.readyState is "complete"
    Caman.DOMUpdated()
  else
    document.addEventListener "DOMContentLoaded", Caman.DOMUpdated, false

# Parses Caman instructions embedded in the HTML data-caman attribute
class CamanParser
  INST_REGEX = "(\\w+)\\((.*?)\\)"

  constructor: (ele, ready) ->
    @dataStr = ele.getAttribute('data-caman')
    @caman = Caman ele, ready.bind(@)

  parse: ->
    @ele = @caman.canvas

    # First we find each instruction as a whole using a global
    # regex search.
    r = new RegExp(INST_REGEX, 'g')
    unparsedInstructions = @dataStr.match r
    return unless unparsedInstructions.length > 0

    # Once we gather all the instructions, we go through each one
    # and parse out the filter name + it's parameters.
    r = new RegExp(INST_REGEX)
    for inst in unparsedInstructions
      [m, filter, args] = inst.match(r)

      # Create a factory function so we can catch any errors that
      # are produced when running the filters. This also makes it very
      # simple to support multiple/complex filter arguments.
      instFunc = new Function("return function() {
        this.#{filter}(#{args});
      };")

      try
        func = instFunc()
        func.call @caman
      catch e
        Log.debug e

  execute: ->
    ele = @ele
    @caman.render ->
      ele.parentNode.replaceChild @toImage(), ele