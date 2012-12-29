# Make sure CamanJS loads without errors
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
    before ->
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