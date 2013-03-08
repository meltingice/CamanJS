if exports?
  {Caman} = require "../../dist/caman.full"
  {assert} = require 'chai'

describe "Filters", ->
  beforeEach ->
    # All core filters
    @filters = [
      'fillColor'
      'brightness'
      'saturation'
      'vibrance'
      'greyscale'
      'contrast'
      'hue'
      'colorize'
      'invert'
      'sepia'
      'gamma'
      'noise'
      'clip'
      'channels'
      'curves'
      'exposure'
    ]

  it "are present", ->
    for filter in @filters
      assert.isFunction Caman::[filter]