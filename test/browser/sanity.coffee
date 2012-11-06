# Make sure CamanJS loads without errors
buster.spec.expose()
assert = buster.assert

describe "CamanJS", ->
  it "is present", ->
    assert.isFunction Caman
    assert.isObject Caman.version