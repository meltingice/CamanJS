fs			= require 'fs'
{exec}	= require 'child_process'
util		= require 'util'
{jsmin}	= require 'jsmin'

try
  growl   = require 'growl'
catch error
  growl = null

targetName		= "caman"

###
CoffeeScript Options
###
csSrcDir 			= "src"
csTargetDir		= "dist"

targetCoffee	= "#{csSrcDir}/build.coffee"
targetJS			= "#{csTargetDir}/#{targetName}.js"
targetMinJS		= "#{csTargetDir}/#{targetName}.min.js"

coffeeOpts		= "-r coffeescript-growl -j #{targetName}.js -o #{csTargetDir} -c #{targetCoffee}"

# All source files listed in include order
coffeeFiles		= [
	# These are non-classed functions
	"util"
	
	# Core library
	"caman"
	"camaninstance"

	# Everything else
	"calculate"
	"convert"
	"filter"
	"filters"
	"logger"
	"pixelinfo"
	"renderjob"
	"store"
]

###
Event System
###
finishedCallback = {}
finished = (type) ->      
	finishedCallback[type]() if finishedCallback[type]?

finishListener = (type, cb) ->
	finishedCallback[type] = cb
	
notify = (msg) ->
  return if not growl?
  growl.notify msg, {title: "CamanJS Development", image: "Terminal"}
	
###
Tasks
###
task 'docs', 'Generates documentation for the coffee files', ->
	util.log 'Invoking docco on the CoffeeScript source files'
	exec "docco #{csSrcDir}/*.coffee", (err, stdout, stderr) ->
		util.log err if err
		util.log "Finished generating documentation!"
		notify "Documentation generation finished."
				
task 'watch', 'Automatically recompile the CoffeeScript files when updated', ->
	util.log "Watching for changes in #{csSrcDir}"
	
	for jsFile in coffeeFiles then do (jsFile) ->
		fs.watchFile "#{csSrcDir}/#{jsFile}.coffee", (curr, prev) ->
			if +curr.mtime isnt +prev.mtime
				util.log "#{csSrcDir}/#{jsFile}.coffee updated"
				invoke 'build'
				
task 'build', 'Compile and minify all CoffeeScript source files', ->
	finishListener 'js', -> invoke 'minify'
	invoke 'compile'

task 'compile', 'Compile all CoffeeScript source files', ->
	util.log "Building #{targetJS}"
	contents = []
	remaining = coffeeFiles.length
	
	util.log "Appending #{coffeeFiles.length} files to #{targetCoffee}"
	
	for file, index in coffeeFiles then do (file, index) ->
		fs.readFile "#{csSrcDir}/#{file}.coffee", "utf8", (err, fileContents) ->
			util.log err if err
			
			contents[index] = fileContents
			util.log "[#{index + 1}] #{file}.coffee"
			process() if --remaining is 0
			
	process = ->
		fs.writeFile targetCoffee, contents.join("\n\n"), "utf8", (err) ->
			util.log err if err
			
			exec "coffee #{coffeeOpts}", (err, stdout, stderr) ->
				util.log err if err
				util.log "Compiled #{targetJS}"
				fs.unlink targetCoffee, (err) -> util.log err if err
				finished('js')
				
task 'minify', 'Minify the CoffeeScript files', ->
	util.log "Minifying #{targetJS}"
	fs.readFile targetJS, "utf8", (err, contents) ->
		fs.writeFile targetMinJS, jsmin(contents), "utf8", (err) ->
			util.log err if err