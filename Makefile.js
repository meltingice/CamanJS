#!/usr/bin/env node

var fs = require('fs'),
exec = require('child_process').exec,
jshint = require('./build/jshint').JSHINT,

BUILD_DIR   = 'build',
DIST_DIR    = 'dist',
SRC_DIR     = 'src',
PLUGIN_DIR  = SRC_DIR + '/plugins/plugins',

CORE_LIB = [
  'header', 
  'loader', 
  'util', 
  'io', 
  'events',
  'pixelInfo',
  'render',
  'layers', 
  'filters'
],

jshint_opts = {devel: true, forin: true, undef: true, browser: true};

// First lets jsmin the caman.js source file to get
// things rolling.
console.log("Loading Caman source...");

var caman = "";
CORE_LIB.forEach(function (file) {
  caman += fs.readFileSync(SRC_DIR + "/" + file + ".js", 'UTF-8') + "\n";
});

if ( jshint(caman, jshint_opts) ) {
  console.log("JSHint PASSED - caman.js");
} else {
  console.log("JSHint ERROR! - caman.js");
  jshint.errors.forEach(function (err) {
    console.log(err.id + " line " + err.line + ": " + err.reason);
  });
  
  console.log('---------------------------------');
}

// Include plugins in the build files
var plugin_src,
plugins = "";

// Make sure plugins submodule is initialized first
try {
  fs.readdirSync(PLUGIN_DIR);
  finish();
} catch (e) {
  console.log("####################################");
  console.log("It looks like the CamanJS-Plugins submodule hasn't");
  console.log("been initialized yet. Let me fix that for you.");
  console.log("####################################");
  
  exec('git submodule init', function () {
    exec('git submodule update --recursive', function () {
      finish();
    });
  });
}


function finish() {
  fs.readdirSync(PLUGIN_DIR).forEach(function (plugin) {
    plugin_src = fs.readFileSync(PLUGIN_DIR + '/' + plugin, 'UTF-8');
    
    if ( jshint(plugin_src, jshint_opts) ) {
      console.log("JSHint PASSED - " + plugin);
    } else {
      console.log("JSHint ERROR! - " + plugin);
      jshint.errors.forEach(function (err) {
        console.log(err.id + " line " + err.line + ": " + err.reason);
      });
      
      console.log('---------------------------------');
    }
    
    plugins += "\n" + plugin_src;
  });
  
  // Create dist folder if it doesn't exist
  try {
    fs.statSync(DIST_DIR);
  } catch (e) {
    fs.mkdirSync(DIST_DIR, 0775);
  }
  
  // Without plugins
  fs.writeFileSync(DIST_DIR + '/caman.js', caman);
  
  // With plugins
  fs.writeFileSync(DIST_DIR + '/caman.full.js', caman + plugins);
  
  console.log("\nFinished!");
}