if exports?
  {Caman} = require "../../dist/caman.full"
  {assert} = require 'chai'

describe "CamanJS", ->
  it "is present", ->
    assert.isFunction Caman
    assert.isObject Caman.version

  it "has autoload properly set", ->
    assert Caman.autoload isnt Caman.NodeJS