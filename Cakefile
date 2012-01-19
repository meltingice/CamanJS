fs			= require 'fs'
{exec}	= require 'child_process'
util		= require 'util'
{jsmin}	= require 'jsmin'

try
	packer = require 'packer'
catch err
	packer = null

targetName		= "caman"

###
CoffeeScript Options
###
csSrcDir 			= "src"
csTargetDir		= "dist"

targetCoffee	= "#{csSrcDir}/build"

targetCoreJS			= "#{csTargetDir}/#{targetName}.js"
targetCoreMinJS		= "#{csTargetDir}/#{targetName}.min.js"
targetCorePackJS		= "#{csTargetDir}/#{targetName}.pack.js"
coffeeCoreOpts		= "-r coffeescript-growl -j #{targetName}.js -o #{csTargetDir} -c #{targetCoffee}.coffee"

targetFullJS			= "#{csTargetDir}/#{targetName}.full.js"
targetFullMinJS		= "#{csTargetDir}/#{targetName}.full.min.js"
targetFullPackJS		= "#{csTargetDir}/#{targetName}.full.pack.js"
coffeeFullOpts		= "-r coffeescript-growl -j #{targetName}.full.js -o #{csTargetDir} -c #{targetCoffee}.full.coffee"

# All source files listed in include order
coffeeFiles		= [
	"core/util"
	
	# Core library
	"core/caman"
	"core/camaninstance"

	# Everything else
	"core/blender"
	"core/calculate"
	"core/convert"
	"core/event"
	"core/filter"
	"core/io"
	"core/layer"
	"core/logger"
	"core/pixelinfo"
	"core/plugin"
	"core/renderjob"
	"core/store"

	# Non-core files
	"lib/blenders"
	"lib/filters"
]

pluginsFolder = "src/plugins"

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
	util.log 'Invoking docco on the CoffeeScript source files'
	
	files = coffeeFiles
	files[i] = "src/#{files[i]}.coffee" for i in [0...files.length]

	pluginFiles = fs.readdirSync pluginsFolder
	for plugin in pluginFiles
		continue if fs.statSync("#{pluginsFolder}/#{plugin}").isDirectory()
		files.push "#{pluginsFolder}/#{plugin}"

	exec "docco #{files.join(' ')}", (err, stdout, stderr) ->
		util.log err if err
		util.log "Documentation built into docs/ folder."
				
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

		fs.writeFile "#{targetCoffee}.coffee", core, "utf8", (err) ->
			util.log err if err
			
			exec "coffee #{coffeeCoreOpts}", (err, stdout, stderr) ->
				util.log err if err
				util.log "Compiled #{targetCoreJS}"

				if not err
					fs.unlink "#{targetCoffee}.coffee", (err) -> util.log err if err

				fs.writeFile "#{targetCoffee}.full.coffee", full, "utf8", (err) ->
					util.log err if err

					exec "coffee #{coffeeFullOpts}", (err, stdout, stderr) ->
						util.log err if err
						util.log "Compiled #{targetFullJS}"

						if not err
							fs.unlink "#{targetCoffee}.full.coffee", (err) -> util.log err if err
							
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