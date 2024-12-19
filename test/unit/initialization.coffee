if exports?
  {Caman}   = require "../../dist/caman.full"
  {assert}  = require 'chai'
  {greyImage, greyPath, rgbData}   = require '../ext/grey'

describe "Initialization", ->
  it "fails when given no arguments", ->
    assert.throws Caman

  describe "with a single argument", ->
    it "accepts a file path as a string", ->
      return unless exports?
      assert.doesNotThrow -> Caman(greyPath)

    it "accepts a file/buffer/image object", ->
      assert.doesNotThrow -> Caman(greyImage)
      
    it "returns a Caman object", ->
      caman = Caman(greyImage)
      assert.isObject caman
      assert.isFunction caman.render
      assert.instanceOf caman, Caman

  describe "with two arguments", ->
    it "accepts a file path and a callback", ->
      assert.doesNotThrow ->
        Caman greyImage, ->

    it "accepts a file/buffer object and a callback", ->
      assert.doesNotThrow ->
        Caman greyImage, ->

    it "fires the callback when ready", (done) ->
      Caman greyImage, -> done()
        
  it "correctly reads the image data", (done) ->
    Caman greyImage, ->
      assert.lengthOf @pixelData, 4
      
      [r, g, b, a] = @pixelData
      assert.equal r, 254
      assert.equal g, 254
      assert.equal b, 254
      assert.equal a, 255

      done()

  it "accepts canvas objects detached from DOM", (done) ->
    return done() unless document?
    canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1

    Caman canvas, -> 
      assert.equal @width, 1
      assert.equal @height, 1
      done()

  it "accepts image objects detached from DOM", (done) ->
    return done() unless document?

    Caman greyImage, ->
      assert.equal @width, 1
      assert.equal @height, 1
      done()
