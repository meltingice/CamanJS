Browser = require 'zombie'
assert = require 'assert'

describe "Initialization", ->
  before (done) ->
    @browser = new Browser()
    @browser
      .visit('http://localhost:8000/index.html')
      .then(done, done)

  describe "with a single argument", ->
    it "will throw an exception with an unknown image ID", ->
      assert.exception -> Caman "#nope"

    it "can be given a string ID selector", (done) ->
      Caman "#test", ->
        console.log @pixelData
        assert.defined @pixelData
        assert.tagName $("#test").get(0), "canvas"
        assert.equals @pixelData.length, 4
        done()

    it "can be given an img object", (done) ->
      Caman getGreyImage(), ->
        assert.defined @pixelData
        assert.equals @pixelData.length, 4
        done()

    it "will cache already initialized selectors", ->
      c = Caman "#test"
      assert.defined c.pixelData
      assert.isObject c.pixelData

      Caman "#test", ->
        assert.equals @pixelData, c.pixelData
