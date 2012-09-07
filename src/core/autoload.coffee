# If enabled, we check the page to see if there are any
# images with Caman instructions provided using HTML5
# data attributes.
if Caman.autoload then do ->
  run = ->
    imgs = document.querySelectorAll("img[data-caman]")
    return unless imgs.length > 0

    for img in imgs
      parser = new CamanParser img, ->
        @parse()
        @execute()

  if document.readyState is "complete"
    run()
  else
    document.addEventListener "DOMContentLoaded", run, false
  

class CamanParser
  INST_REGEX = "(\\w+)\\((.*?)\\)"

  instructions: []

  constructor: (@ele, ready) ->
    @dataStr = @ele.getAttribute('data-caman')
    @caman = Caman @ele, ready.bind(@)

  parse: ->
    # First we find each instruction as a whole using a global
    # regex search.
    r = new RegExp(INST_REGEX, 'g')
    unparsedInstructions = @dataStr.match r
    return unless unparsedInstructions.length > 0

    # Once we gather all the instructions, we go through each one
    # and parse out the filter name + it's parameters.
    r = new RegExp(INST_REGEX)
    for inst in unparsedInstructions
      console.log inst.match(r)

  execute: ->