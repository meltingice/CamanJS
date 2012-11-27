# Make sure CamanJS loads without errors
{Caman} = require "../../dist/caman.full"
{assert} = require 'chai'

describe "CamanJS", ->
  it "is present", ->
    assert.isFunction Caman
    assert.isObject Caman.version

  it "has autoload disabled", ->
    assert Caman.autoload is false