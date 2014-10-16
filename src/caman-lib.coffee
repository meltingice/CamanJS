module.exports = (Caman) ->
  require('./caman-lib/filters.coffee')(Caman)
  require('./caman-lib/convolution.coffee')(Caman)
