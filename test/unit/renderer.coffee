if exports?
  {Caman} = require "../../dist/caman.full"
  {assert} = require 'chai'
  {greyImage, greyPath, rgbData}   = require '../ext/grey'

describe "Renderer", ->
  it "has the proper number of default blocks", ->
    cpus = if Caman.NodeJS then require('os').cpus().length else 4
    assert.equal Caman.Renderer.Blocks, cpus

  it "executes callback when there are no jobs", (done) ->
    Caman greyImage, ->
      @render -> done()

  it "properly stores the job queue", (done) ->
    Caman greyImage, ->
      @brightness 10
      @sharpen 10

      assert.equal 2, @renderer.renderQueue.length

      assert.property @renderer.renderQueue[0], 'type'
      assert.property @renderer.renderQueue[0], 'name'
      assert.property @renderer.renderQueue[0], 'processFn'
      
      assert.equal Caman.Filter.Type.Single, @renderer.renderQueue[0].type
      assert.equal 'brightness', @renderer.renderQueue[0].name
      
      assert.equal Caman.Filter.Type.Kernel, @renderer.renderQueue[1].type
      assert.equal 'Sharpen', @renderer.renderQueue[1].name
      done()

  it "creates a separate array for kernel manipulated pixels", (done) ->
    Caman greyImage, ->
      @render ->
        assert.isNotNull @renderer.modPixelData
        assert.equal @pixelData.length, @renderer.modPixelData.length
        assert.instanceOf @renderer.modPixelData, Uint8Array
        done()

  it "executes callback after all jobs are finished", (done) ->
    Caman greyImage, ->
      @brightness 10
      @contrast 10
      @render -> done()

  it "properly handles layer rendering", (done) ->
    Caman greyImage, ->
      @newLayer ->
        @setBlendingMode 'normal'
        @opacity 100
        @fillColor '#ff0000'

      assert.equal 3, @renderer.renderQueue.length
      assert.equal Caman.Filter.Type.LayerDequeue, @renderer.renderQueue[0].type
      assert.equal Caman.Filter.Type.LayerFinished, @renderer.renderQueue[2].type

      done()
