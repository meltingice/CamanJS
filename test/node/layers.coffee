# Make sure CamanJS loads without errors
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