if exports?
  {Caman}   = require "../../dist/caman.full"
  {assert}  = require 'chai'
  {greyImage, greyPath, rgbData}   = require '../ext/grey'

describe "io", ->
  it "should generate image tag", (done) ->
    Caman greyImage, ->
      img = @toImage()
      assert img.src && img.src.match(/^data:image\/png;base64/)
      done()

  it "should generate base64 data url", (done) ->
    Caman greyImage, ->
      dataURL = @toBase64()
      assert dataURL.match(/^data:image\/png;base64/)
      done()
