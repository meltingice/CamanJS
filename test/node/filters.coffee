# Make sure CamanJS loads without errors
{Caman} = require "../../dist/caman.full"
{assert} = require 'chai'

describe "Filters", ->
  before ->
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