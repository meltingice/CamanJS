// This is actually where the Caman object is defined, and is where the Caman initialization code resides. 
// There are many different initialization for Caman, which are described on the 
// [Basic Usage](http://camanjs.com/docs) page.
//
// Initialization is tricky because we need to make sure everything we need is actually fully loaded in the 
// DOM before proceeding. When initialized on an image, we need to make sure that the image is done loading 
// before converting it to a canvas element and writing the pixel data. If we do this prematurely, the browser
// will throw a DOM Error, and chaos will ensue. In the event that we initialize Caman on a canvas element 
// while specifying an image URL, we need to create a new image element, load the image, then continue with 
// initialization.
//
// The main goal for Caman was simplicity, so all of this is handled transparently to the end-user. This is also
// why this piece of code is a bit lengthy. Once everything is loaded, and Caman is initialized, the callback 
// function is fired.
//
//ÊThere are also a few utility functions in this file that are used throughout the Caman source. Caman.$ is a 
// simple helper for retrieving DOM nodes by ID. There are also a few functions for handling and detecting remote images.

/*global Caman: true */ 
(function () {

// Ensure compatibility for browsers without JS debugging consoles
if (!('console' in window)) {
  window.console = {
    log: function () {},
    info: function () {},
    error: function () {}
  };
}

// Here it begins. Caman is defined.
var Caman = function () {
  if (arguments.length == 1) {
    // 1 argument = init image or retrieve manip object

    if (Caman.store[arguments[0]]) {      
      
      return Caman.store[arguments[0]];
      
    } else {
          
      // Not initialized; load Caman
      return new Caman.manip.loadImage(arguments[0]);
      
    }
  } else if (arguments.length == 2) {
    // 2 arguments - init image and/or invoke callback
    
    if (Caman.store[arguments[0]]) {
      // Already initialized, invoke callback with manip set to 'this'
      return arguments[1].call(Caman.store[arguments[0]], Caman.store[arguments[0]]);
    } else {
      if (typeof arguments[1] === 'function') {
        
        // Not initialized; load Caman into image then invoke callback and return manip
        var tag = Caman.$(arguments[0]).nodeName.toLowerCase();
        if (tag == "img") {
          return new Caman.manip.loadImage(arguments[0], arguments[1]);
        } else if (tag == "canvas") {
          // Initialize on a canvas without an image
          return new Caman.manip.loadCanvas(null, arguments[0], arguments[1]);
        }
        
      } else if (typeof arguments[1] === 'string') {
        
        // Not initialized; load image URL into canvas and return manip
        return new Caman.manip.loadCanvas(arguments[0], arguments[1]);
        
      }
    }
  } else if (arguments.length == 3) {
    // 3 arguments - init image URL into canvas and invoke callback
    if (Caman.store[arguments[0]]) {
    
      // Already initialized; invoke callback and return manip
      return arguments[2].call(Caman.store[arguments[1]], Caman.store[arguments[1]]);
      
    } else {
      
      // Not initialized; load image into canvas, invoke callback, and return manip
      return new Caman.manip.loadCanvas(arguments[0], arguments[1], arguments[2]);
      
    }
  }
};

// Simple version information
Caman.version = {
  release: "2.3",
  date: "7-5-2011"
};

// Private function for finishing Caman initialization
var finishInit = function (image, canvas, callback) {
  var self = this;
  
  // Used for saving pixel layers
  this.pixelStack = [];
  
  // Stores all of the layers waiting to be rendered
  this.layerStack = [];
  
  // Stores all of the render operatives for the renderer
  this.renderQueue = [];
  
  // Store a reference to the canvas element
  this.canvas = canvas;  
  this.context = this.canvas.getContext("2d");
  
  if (image !== null) {
    // If we are initializing with an image, we inspect the HTML5 data elements camanwidth and camanheight
    // to see if we need to scale the canvas at all.
    var old_height = image.height, old_width = image.width;
    var new_width = image.getAttribute('data-camanwidth') || canvas.getAttribute('data-camanwidth');
    var new_height = image.getAttribute('data-camanheight') || canvas.getAttribute('data-camanheight');
    if (new_width || new_height) {
      if (new_width) {
        image.width = parseInt(new_width, 10);
        
        if (new_height) {
          image.height = parseInt(new_height, 10);
        } else {
          image.height = image.width * old_height / old_width;
        }
      } else if (new_height) {
        image.height = parseInt(new_height, 10);
        image.width = image.height * old_width / old_height;
      }
    }
    
    // Update the canvas sizes to match the image sizes
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Draw the image onto the canvas
    this.context.drawImage(image, 0, 0, image.width, image.height); 
  }
  
  // Get and store references to the image data and pixel array
  this.image_data = this.context.getImageData(0, 0, canvas.width, canvas.height);
  this.pixel_data = this.image_data.data;

  // Store a simple reference to the canvas dimensions, which really comes in handy with some filters
  this.dimensions = {
    width: canvas.width,
    height: canvas.height
  };
  
  // Store a long-living reference to the Caman object that can be found in a global scope.
  Caman.store[this.canvas_id] = this;
  
  // Execute the user's callback function to begin defining transformations
  callback.call(this, this);
  
  return this;
};

Caman.manip = Caman.prototype = {

  // Used for loading Caman onto an image element
  loadImage: function (image_id, callback) {
    var domLoaded,
    self = this,
    image, proxyURL,
    startFn = function () {
      var canvas = document.createElement('canvas');
      
      if(Caman.$(image_id) === null || Caman.$(image_id).nodeName.toLowerCase() !== 'img') {
        // element doesn't exist or isn't an image
        throw "Given element ID isn't an image: " + image_id;
      }

      canvas.id = image.id;
      
      if (image.getAttribute('data-camanwidth')) {
        canvas.setAttribute('data-camanwidth', image.getAttribute('data-camanwidth'));
      }
      if (image.getAttribute('data-camanheight')) {
        canvas.setAttribute('data-camanheight', image.getAttribute('data-camanheight'));
      }
      
      image.parentNode.replaceChild(canvas, image);
      
      // Store the canvas ID
      this.canvas_id = image_id;
      
      this.options = {
        canvas: image_id,
        image: image.src
      };
      
      finishInit.call(self, image, canvas, callback);
      
      return this;
    };

    // Default callback
    callback = callback || function () {};
    
    // Check to see if we've been passed a DOM node or a string representing
    // the node's ID
    if (typeof image_id === "object" && image_id.nodeName.toLowerCase() == "img") {
      // DOM node
      var element = image_id;
      
      // If the image has an ID, use it
      if (image_id.id) {
        image_id = element.id;
      } else {
        // Otherwise, generate a unique ID for the image
        image_id = "caman-" + Caman.uniqid.get();
        element.id = image_id;
      }
    }

    // Need to see if DOM is loaded already
    domLoaded = (Caman.$(image_id) !== null);
    if (domLoaded) {
      // DOM loaded, proceed immediately
      image = Caman.$(image_id);
      proxyURL = Caman.remoteCheck(image.src);
      
      if (proxyURL) {
        // Image is remote. Reload image via proxy
        image.src = proxyURL;
        
        image.onload = function () {
          startFn.call(self);
        };
      } else {
        if (image.complete) {
          startFn.call(this);
        } else {
          image.onload = function () {
            startFn.call(self);
          };
        }
      }
    } else {
      // If it's not, wait for the DOM to load before continuing to prevent errors
      document.addEventListener("DOMContentLoaded", function () {
        image = Caman.$(image_id);
        proxyURL = Caman.remoteCheck(image.src);
        
        if (proxyURL) {
          // Image is remote. Reload image via proxy
          image.src = proxyURL;
        }
        
        image.onload = function () {
          startFn.call(self);
        };
      }, false);
    }
    
    return this;
  },
  
  // Used for initializing Caman onto a canvas element already in the DOM
  loadCanvas: function (url, canvas_id, callback) {
    var domLoaded,
    self = this,
    startFn = function () {
      var canvas = Caman.$(canvas_id),
      image = document.createElement('img'),
      proxyURL = Caman.remoteCheck(url);
      
      if (Caman.$(canvas_id) === null || Caman.$(canvas_id).nodeName.toLowerCase() !== 'canvas') {
        // element doesn't exist or isn't a canvas
        throw "Given element ID isn't a canvas: " + canvas_id;
      }
      
      if (url === null) {
        // No image to load into the canvas, so we simply continue
        finishInit.call(self, null, canvas, callback);
      } else {
        // Load the image, and complete initialization when it loads
        image.onload = function () {
          finishInit.call(self, image, canvas, callback);
        };
        
        if (proxyURL) {
          image.src = proxyURL;
        } else {
          image.src = url;
        }
      }
      
      this.canvas_id = canvas_id;
      
      this.options = {
        canvas: canvas_id,
        image: image.src
      };
    };

    // Default callback
    callback = callback || function () {};
    
    // Check to see if we've been passed a DOM node or a string representing
    // the node's ID
    if (typeof canvas_id === "object" && canvas_id.nodeName.toLowerCase() == "canvas") {
      // DOM node
      var element = canvas_id;
      
      if (canvas_id.id) {
        canvas_id = element.id;
      } else {
        canvas_id = "caman-" + Caman.uniqid.get();
        element.id = canvas_id;
      }
    }
    
    // Need to see if DOM is loaded
    domLoaded = (Caman.$(canvas_id) !== null);
    if (domLoaded) {
      startFn.call(this);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        startFn.call(self);
      }, false);
    }
    
    return this;
  }
};

// In order to avoid having 3 different types of object contexts here, we simply set the prototypes
// of loadImage and loadCanvas to Caman.manip.
Caman.manip.loadImage.prototype = Caman.manip;
Caman.manip.loadCanvas.prototype = Caman.manip;

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

// Checks a URL to determine if it is remote or not.
Caman.isRemote = function (url) {
  // Regex for extracting the domain of an image
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

// Checks to see if an image is remote. If it is, and a proxy is defined, it returns the proxy URL.
// If it's remote and no proxy URL is defined, it will log an error and attempt to continue.
// Anything else and it returns null.
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

window.Caman = Caman;

}());