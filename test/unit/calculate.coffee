if exports?
  {Caman} = require "../../dist/caman.full"
  {assert} = require 'chai'

describe "Calculate", ->
  describe "random ranges", ->
    it "returns a number", ->
      assert.typeOf Caman.Calculate.randomRange(0, 5), 'number'
      assert.typeOf Caman.Calculate.randomRange(-5, 0), 'number'
      assert.typeOf Caman.Calculate.randomRange(0, 0), 'number'

    it "returns a rounded number by default", ->
      value = Caman.Calculate.randomRange(0, 10)
      assert.equal value, Math.round(value)

    it "returns a float when requested", ->
      value = Caman.Calculate.randomRange(0, 10, true)
      assert.notStrictEqual value, Math.round(value)

  describe "luminance", ->
    beforeEach ->
      @rgba = 
        r: 100
        g: 100
        b: 100
        a: 255

      @value = Caman.Calculate.luminance(@rgba)
      @expected = 0.299 * 100 + 0.587 * 100 + 0.114 * 100

    it "returns a number", ->
      assert.typeOf @value, 'number'

    it "is computed correctly", ->
      assert.strictEqual @expected, @value

    it "is not dependent on the alpha channel", ->
      rgb = 
        r: 100
        g: 100
        b: 100

      value = Caman.Calculate.luminance(rgb)
      assert.typeOf value, 'number'
      assert.strictEqual @expected, value

  describe "bezier", ->
    beforeEach ->
      @bezier = Caman.Calculate.bezier [0, 0], [100, 100], [200, 200], [255, 255]

    it "returns an object", ->
      assert.typeOf @bezier, 'object'

    it "returns a Y value for every X value", ->
      # Simple curve
      assert.property @bezier, i for i in [0..255]

      # More intense curve
      bezier = Caman.Calculate.bezier [0, 0], [100, 5], [105, 200], [255, 255]
      assert.property bezier, i for i in [0..255]

      # curve that isn't between [0..255]
      bezier2 = Caman.Calculate.bezier [20, 20], [100, 100], [200, 150], [220, 200]
      assert.property bezier2, i for i in [20..220]

    it "properly clamps Y values when set", ->
      # This makes a straight line
      bezier = Caman.Calculate.bezier [0, 100], [100, 0], [200, 255], [255, 100], 100, 100
      assert.propertyVal bezier, i, 100 for i in [0..255]