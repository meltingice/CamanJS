fs = require 'fs'
browserify = require 'browserify'

task 'compile', 'Compile with browserify for the web', ->
  browserify
    noParse: [
      'fs'
    ]
  .transform('coffeeify')
  .require('./src/caman.coffee', expose: 'caman')
  .bundle (err, src) ->
    return console.log(err) if err?
    fs.writeFile './dist/caman.js', src, ->
      fs.stat './dist/caman.js', (err, stats) ->
        console.log "Compiled to ./dist/caman.js - #{Math.round(stats.size / 1024)}KB"
