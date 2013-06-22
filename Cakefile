fs      = require 'fs'
{exec}  = require 'child_process'
util    = require 'util'
{jsmin} = require 'jsmin'

try
  packer = require 'packer'
catch err
  packer = null

targetName    = "caman"

###
CoffeeScript Options
###
csSrcDir      = "src"
csTargetDir   = "dist"

targetCoffee  = "#{csTargetDir}/caman"

targetCoreJS      = "#{csTargetDir}/#{targetName}.js"
targetCoreMinJS   = "#{csTargetDir}/#{targetName}.min.js"
targetCorePackJS    = "#{csTargetDir}/#{targetName}.pack.js"
coffeeCoreOpts    = "-j #{targetName}.js -o #{csTargetDir}"

targetFullJS      = "#{csTargetDir}/#{targetName}.full.js"
targetFullMinJS   = "#{csTargetDir}/#{targetName}.full.min.js"
targetFullPackJS    = "#{csTargetDir}/#{targetName}.full.pack.js"
coffeeFullOpts    = "-j #{targetName}.full.js -o #{csTargetDir}"

# All source files listed in include order
coffeeFiles   = [
  "core/module"
  "core/util"
  
  # Core library
  "core/caman"

  # Everything else
  "core/analyze"
  "core/autoload"
  "core/blender"
  "core/calculate"
  "core/convert"
  "core/event"
  "core/filter"
  "core/io"
  "core/layer"
  "core/logger"
  "core/pixel"
  "core/plugin"
  "core/renderer"
  "core/store"

  # Non-core files
  "lib/blenders"
  "lib/filters"
  "lib/size"
]

pluginsFolder = "src/plugins/src"

###
Event System
###
finishedCallback = {}
finished = (type) ->      
  finishedCallback[type]() if finishedCallback[type]?

finishListener = (type, cb) ->
  finishedCallback[type] = cb

getPlugins = ->
  content = ""

  util.log "Gathering plugin files in #{pluginsFolder}"
  pluginFiles = fs.readdirSync pluginsFolder

  util.log "Discovered #{pluginFiles.length} plugins"
  for plugin in pluginFiles
    continue if fs.statSync("#{pluginsFolder}/#{plugin}").isDirectory()
    content += fs.readFileSync("#{pluginsFolder}/#{plugin}", "utf8") + "\n\n"

  return content

###
Tasks
###
task 'docs', 'Generates documentation for the coffee files', ->
  util.log 'Invoking docco on the source files'
  
  files = []
  files[i] = "src/#{coffeeFiles[i]}.coffee" for i in [0...coffeeFiles.length]

  pluginFiles = fs.readdirSync pluginsFolder
  for plugin in pluginFiles
    continue if fs.statSync("#{pluginsFolder}/#{plugin}").isDirectory()
    files.push "#{pluginsFolder}/#{plugin}"

  exec "node_modules/docco/bin/docco -l parallel #{files.join(' ')}", (err, stdout, stderr) ->
    util.log err if err
    util.log "Documentation built into the docs/ folder."

  util.log 'Invoking codo on the source files'
  exec "node_modules/codo/bin/codo", (err, stdout, stderr) ->
    util.log err if err
    util.log "API reference built into the api/ folder."
    console.log stdout

option '-d', '--docs', 'Automatically recompile documentation (used with watch)'        
task 'watch', 'Automatically recompile the CoffeeScript files when updated', (options) ->
  util.log "Watching for changes in #{csSrcDir}"
  util.log "Automatically recompiling documentation!" if options.docs
  
  for jsFile in coffeeFiles then do (jsFile) ->
    fs.watchFile "#{csSrcDir}/#{jsFile}.coffee", (curr, prev) ->
      if +curr.mtime isnt +prev.mtime
        util.log "#{csSrcDir}/#{jsFile}.coffee updated"
        invoke 'build'
        invoke 'docs' if options.docs
        
task 'build', 'Compile and minify all CoffeeScript source files', ->
  finishListener 'js', -> invoke 'minify'
  invoke 'compile'

option '-m', '--map', 'Compile with source maps'
task 'compile', 'Compile all CoffeeScript source files', (options) ->
  util.log "Building #{targetCoreJS} and #{targetFullJS}"
  contents = []
  remaining = coffeeFiles.length

  util.log "Appending #{coffeeFiles.length} files to #{targetCoffee}.coffee"
  
  for file, index in coffeeFiles then do (file, index) ->
    fs.readFile "#{csSrcDir}/#{file}.coffee", "utf8", (err, fileContents) ->
      util.log err if err
      
      contents[index] = fileContents
      util.log "[#{index + 1}] #{file}.coffee"
      process() if --remaining is 0
      
  process = ->
    core = contents.join("\n\n")
    full = core + "\n\n" + getPlugins()

    if options.map
      util.log "Source map support enabled"
      coreOpts = "#{coffeeCoreOpts} -m #{targetCoffee}.coffee"
      fullOpts = "#{coffeeFullOpts} -m #{targetCoffee}.full.coffee"
    else
      coreOpts = "#{coffeeCoreOpts} -c #{targetCoffee}.coffee"
      fullOpts = "#{coffeeFullOpts} -c #{targetCoffee}.full.coffee"

    fs.writeFile "#{targetCoffee}.coffee", core, "utf8", (err) ->
      util.log err if err
      
      exec "coffee #{coreOpts}", (err, stdout, stderr) ->
        util.log err if err
        util.log "Compiled #{targetCoreJS}"

        if options.map
          map = JSON.parse fs.readFileSync("#{targetCoffee}.map")
          map.sources = ["caman.coffee"]
          fs.writeFileSync "#{targetCoffee}.map", JSON.stringify(map)

        fs.writeFile "#{targetCoffee}.full.coffee", full, "utf8", (err) ->
          util.log err if err

          exec "coffee #{fullOpts}", (err, stdout, stderr) ->
            util.log err if err
            util.log "Compiled #{targetFullJS}"

            if options.map
              map = JSON.parse fs.readFileSync("#{targetCoffee}.full.map")
              map.sources = ["caman.full.coffee"]
              fs.writeFileSync "#{targetCoffee}.full.map", JSON.stringify(map)

            # if not err
            #   fs.unlink "#{targetCoffee}.full.coffee", (err) -> util.log err if err
              
            finished('js')
    
        
task 'minify', 'Minify the CoffeeScript files', ->
  util.log "Minifying #{targetCoreJS}"
  fs.readFile targetCoreJS, "utf8", (err, contents) ->
    fs.writeFile targetCoreMinJS, jsmin(contents), "utf8", (err) ->
      util.log err if err

    if packer
      util.log "Packing #{targetCoreJS}"
      fs.writeFile targetCorePackJS, packer.pack(contents, true), "utf8", (err) ->
        util.log err if err

  util.log "Minifying #{targetFullJS}"
  fs.readFile targetFullJS, "utf8", (err, contents) ->
    fs.writeFile targetFullMinJS, jsmin(contents), "utf8", (err) ->
      util.log err if err

    if packer
      util.log "Packing #{targetFullJS}"
      fs.writeFile targetFullPackJS, packer.pack(contents, true), "utf8", (err) ->
        util.log err if err