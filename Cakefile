fs = require 'fs'
browserify = require 'browserify'
UglifyJS = require 'uglify-js'
Promise = require 'bluebird'

writeFile = (dest, src) ->
  new Promise (resolve, reject) ->
    fs.writeFile dest, src, ->
      fs.stat dest, (err, stats) ->
        console.log "Wrote #{dest} - #{Math.round(stats.size / 1024)}KB"
        resolve()

task 'compile', 'Compile with browserify for the web', ->
  browserify
    noParse: [
      'fs'
    ]
  .transform('coffeeify')
  .require('./src/caman.coffee', expose: 'caman')
  .bundle (err, src, map) ->
    return console.log(err) if err?

    writeFile('./dist/caman.js', src)
      .then ->
        minSrc = UglifyJS.minify './dist/caman.js', 
          outSourceMap: 'caman.js.map'
          sourceRoot: '/'

        writeFile './dist/caman.min.js', minSrc.code
        minSrc
      .then (minSrc) ->
        writeFile './dist/caman.js.map', minSrc.map
      .then ->
        console.log "Finished."

    
