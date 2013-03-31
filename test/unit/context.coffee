if exports?
  {Caman} = require '../../dist/caman.full'
  {assert} = require 'chai'
  {greyPath} = require '../ext/grey'

  Canvas = require 'canvas'

describe "Context", ->
  it "can be updated after external changes", (done) ->
    caman = Caman greyPath, ->
      canvas = caman.canvas
      context = canvas.getContext('2d')
      context.fillStyle = "rgba(255, 0, 0, 1)"
      context.fillRect(0, 0, canvas.width, canvas.height)

      imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      pixelData = imageData.data

      assert pixelData isnt caman.pixelData

      @reloadCanvasData()

      for i in [0...caman.pixelData.length]
        assert.equal caman.pixelData[i], pixelData[i]

      done()