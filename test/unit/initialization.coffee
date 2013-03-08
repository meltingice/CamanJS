if exports?
  {Caman}   = require "../../dist/caman.full"
  {assert}  = require 'chai'
  {greyImage, greyPath, rgbData}   = require '../ext/grey'

describe "Initialization", ->
  it "fails when given no arguments", ->
    assert.throws Caman

  describe "with a single argument", ->
    it "accepts a file path as a string", ->
      assert.doesNotThrow -> Caman(greyPath)

    it "accepts a file/buffer object", ->
      assert.doesNotThrow -> Caman(greyImage)
      
    it "returns a Caman object", ->
      caman = Caman(greyPath)
      assert.isObject caman
      assert.isFunction caman.render
      assert.instanceOf caman, Caman

  describe "with two arguments", ->
    it "accepts a file path and a callback", ->
      assert.doesNotThrow ->
        Caman greyPath, ->

    it "accepts a file/buffer object and a callback", ->
      assert.doesNotThrow ->
        Caman greyImage, ->

    it "fires the callback when ready", (done) ->
      Caman greyPath, -> done()
        
  it "correctly reads the image data", (done) ->
    Caman greyPath, ->
      assert.lengthOf @pixelData, 4
      
      [r, g, b, a] = @pixelData
      assert.equal r, 254
      assert.equal g, 254
      assert.equal b, 254
      assert.equal a, 255

      done()
