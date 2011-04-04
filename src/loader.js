var fs  = require('fs'),
Canvas  = require('canvas'),
Image = Canvas.Image;

/*
 * Responsible for loading CamanJS and setting everything up.
 * The Caman() function is defined here.
 */

var Caman = function ( file, ready ) {
  return new Caman.manip.load(file, ready);
};

Caman.manip = Caman.prototype = {
  /*
   * Sets up everything that needs to be done before the filter
   * functions can be run. This includes loading the image into
   * the canvas element and saving lots of different data about
   * the image.
   */
  load: function(file, ready) {
    var self = this,
    img = new Image();
    
    file = fs.realpathSync(file);

    img.onload = function () {
      var canvas = new Canvas(img.width, img.height);
      
      self.canvas = canvas;
      self.context = canvas.getContext('2d');
      self.context.drawImage(img, 0, 0);
      self.image_data = self.context.getImageData(0, 0, img.width, img.height);
      self.pixel_data = self.image_data.data;
      
      self.dimensions = {
        width: img.width,
        height: img.height
      };
      
      self.renderQueue = [];
      self.pixelStack = [];
      self.layerStack = [];
      
      if(typeof ready === "function") { ready.call(self, self); }
      
      Caman.store[file] = self;
      
      return self;
    };
    
    img.onerror = function (err) {
      throw err;
    };
    
    img.src = file;
  }
};

Caman.manip.load.prototype = Caman.manip;

// Helper function since document.getElementById()
// is a mouthful. Note that this will not conflict
// with jQuery since this Caman.$ variable does not exist
// in the global window scope.
Caman.$ = function (id) {
  if (id[0] == '#') {
    id = id.substr(1);
  }
  
  return document.getElementById(id);
};

Caman.store = {};

Caman.isRemote = function (url) {
  var domain_regex = /(?:(?:http|https):\/\/)((?:\w+)\.(?:(?:\w|\.)+))/,
  test_domain;
  
  if (!url || !url.length) {
    return;
  }
  
  var matches = url.match(domain_regex);
  if (matches) {
    test_domain = matches[1];
  
    return test_domain != document.domain;
  } else {
    return false;
  }
};

Caman.remoteCheck = function (src) {
  // Check to see if image is remote or not
  if (Caman.isRemote(src)) {
    if (!Caman.remoteProxy.length) {
      console.info("Attempting to load remote image without a configured proxy, URL: " + src);
      return;
    } else {
      if (Caman.isRemote(Caman.remoteProxy)) {
        console.info("Cannot use a remote proxy for loading remote images due to same-origin policy");
        return;
      }
      
      // We have a remote proxy setup properly, so lets alter the image src
      return Caman.remoteProxy + "?url=" + encodeURIComponent(src);
    }
  }
};

exports.Caman = Caman;