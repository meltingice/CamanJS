if exports?
  {Caman}   = require "../../dist/caman.full"
  {assert}  = require 'chai'
  {greyPath, rgbData}   = require '../ext/grey'

describe "Layers", ->
  it "can be created", (done) ->
    Caman greyPath, ->
      @newLayer ->
        assert.isObject @c
        assert.isObject @options
        assert @canvas
        assert.isNumber @layerID
        assert.lengthOf @c.pixelData, @pixelData.length

        done()

  it "have the correct defaults", (done) ->
    Caman greyPath, ->
      @newLayer ->
        assert.deepEqual @options,
          blendingMode: 'normal'
          opacity: 1.0

        [r, g, b, a] = @pixelData
        assert.equal r, 0
        assert.equal g, 0
        assert.equal b, 0
        assert.equal a, 0

        done()

  it "properly applies to the parent layer", (done) ->
    Caman greyPath, ->
      @newLayer ->
        @setBlendingMode 'normal'
        @opacity 100
        @fillColor '#ff0000'

      @render ->
        assert.equal 255, @pixelData[0]
        assert.equal 0, @pixelData[1]
        assert.equal 0, @pixelData[2]
        assert.equal 255, @pixelData[3]

        done()