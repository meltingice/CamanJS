var fs = require('fs'),
smoosh = require('smoosh'),
exec = require('child_process').exec

SRC_DIR = 'src',
PLUGIN_DIR = 'src/plugins/plugins';

/*
 * Prepare our plugins
 */
 
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
  // then generate plugins.js file
  try {
    // Remove plugins.js if it exists
    fs.statSync(SRC_DIR + "/plugins/plugins.js");
    fs.unlinkSync(SRC_DIR + "/plugins/plugins.js");
  } catch (e) { /* Do nothing */ }
  
  var plugins = "";
  fs.readdirSync(PLUGIN_DIR).forEach(function (plugin) {
    plugins += fs.readFileSync(PLUGIN_DIR + '/' + plugin, 'UTF-8') + "\n";
  });
  
  // output plugins.js
  fs.writeFileSync(SRC_DIR + "/plugins/plugins.js", plugins);
  
  /*
   * Time to smoosh!
   */
  smoosh.config('./config.json');
  smoosh.run().build().analyze();
  
  // Remove the temporary plugins.js file
  fs.unlinkSync(SRC_DIR + "/plugins/plugins.js");
}