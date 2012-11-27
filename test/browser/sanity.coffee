# Make sure CamanJS loads without errors
Browser = require 'zombie'
#Browser.debug = true

describe "CamanJS", ->
  before (done) ->
    @browser = new Browser()
    @browser
      .visit('http://localhost:8000/index.html')
      .then(done, done)

  it "is present", ->
    @browser.evaluate ->
      @assert.isFunction @Caman
      @assert.isObject @Caman.version
      @assert.equal @Caman, false