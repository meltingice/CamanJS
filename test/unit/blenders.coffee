if exports?
  {Caman} = require "../../dist/caman.full"
  {assert} = require 'chai'

describe "Blenders", ->
  beforeEach ->
    @rgbaLayer =
      r: 100
      g: 100
      b: 100
      a: 255

    @rgbaParent =
      r: 200
      g: 200
      b: 200
      a: 255

    @blenders = [
      'normal'
      'multiply'
      'screen'
      'overlay'
      'difference'
      'addition'
      'exclusion'
      'softLight'
      'lighten'
      'darken'
    ]

  it "are present", ->
    for blender in @blenders
      assert.property Caman.Blender.blenders, blender

  it "can be executed", ->
    for blender in @blenders
      assert.doesNotThrow =>
        Caman.Blender.execute blender, @rgbaLayer, @rgbaParent

  it "return an RGB(A) object", ->
    for blender in @blenders
      rgba = Caman.Blender.execute blender, @rgbaLayer, @rgbaParent
      assert.isObject rgba
      assert.property rgba, 'r'
      assert.property rgba, 'g'
      assert.property rgba, 'b'

