# Make sure CamanJS loads without errors
buster.spec.expose()
assert = buster.assert

{Caman} = require "../../dist/caman.full"

describe "CamanJS", ->
  it "is present", ->
    assert.isFunction Caman
    assert.isObject Caman.version