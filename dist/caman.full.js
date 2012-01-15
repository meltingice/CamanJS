/*!
 * CamanJS - Pure HTML5 Javascript (Ca)nvas (Man)ipulation
 * http://camanjs.com/
 *
 * Version 2.3
 *
 * Copyright 2011, Ryan LeFevre
 * Licensed under the new BSD License.
 * See LICENSE for more info.
 *
 * Project Contributors:
 *   Ryan LeFevre - Lead Developer and Project Maintainer
 *    Twitter: @meltingice
 *    GitHub: http://github.com/meltingice
 *
 *   Rick Waldron - Plugin Architect and Developer
 *    Twitter: @rwaldron
 *    GitHub: http://github.com/rwldrn
 *
 *   Cezar Sa Espinola - Developer
 *    Twitter: @cezarsa
 *    GitHub: http://github.com/cezarsa
 */
 
 // Nothing to see here, move along now...
 
/*global Caman: true */
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
// There are also a few utility functions in this file that are used throughout the Caman source. Caman.$ is a 
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
      return Caman.remoteProxy + "?camanProxyUrl=" + encodeURIComponent(src);
    }
  }
};

window.Caman = Caman;

}());
// Utility functions that help out in various areas of CamanJS.

/*global Caman: true */
(function (Caman) {

// Shortcuts
var forEach = Array.prototype.forEach,
hasOwn = Object.prototype.hasOwnProperty,
slice = Array.prototype.slice;

Caman.plugin = {};

// Function.prototype.bind polyfill
if ( !Function.prototype.bind ) {

  Function.prototype.bind = function( obj ) {
    var slice = [].slice,
        args = slice.call(arguments, 1), 
        self = this, 
        nop = function () {}, 
        bound = function () {
          return self.apply( this instanceof nop ? this : ( obj || {} ), 
                              args.concat( slice.call(arguments) ) );    
        };

    nop.prototype = self.prototype;

    bound.prototype = new nop();

    return bound;
  };
}

// When Caman is output as a string, we can output some pretty version and release info data
// instead of throwing an error or something boring.
Caman.toString = Caman.manip.toString = function () {
	return "Version " + Caman.version.release + ", Released " + Caman.version.date;
};

// Utility forEach function for iterating over objects/arrays. If the browser has native forEach,
// then it will use that instead.
Caman.forEach = function( obj, fn, context ) {
  
  if ( !obj || !fn ) {
    return {};
  }
  
  context = context || this;
  
  // Use native whenever possible
  if ( forEach && obj.forEach === forEach ) {
    return obj.forEach(fn, context);
  } 

  for ( var key in obj ) {
    if ( hasOwn.call(obj, key) ) {
      fn.call(context, obj[key], key, obj);
    } 
  }        

  return obj;
};

// Used for extending the object, primarily the Caman object add new functionality to the base library.
Caman.extend = function( obj ) {
  var dest = obj, src = slice.call(arguments, 1);

  Caman.forEach( src, function( copy ) {
    for ( var prop in copy ) {
      if (copy.hasOwnProperty(prop)) {
        dest[prop] = copy[prop];
      }
    }
  });
  
  return dest;      
};

// Clamps an RGB value between 0 and 255. This is necessary
// to run on all updated pixel values in order to conform to
// the spec (which says that values < 0 or > 255 will be modulo'd
// instead of clamped.
Caman.clampRGB = function (value) {
  if (value > 255) return 255;
  else if (value < 0) return 0;
  return value;
};

// Here we define the proxies that ship with CamanJS for easy usage.
Caman.useProxy = function (lang) {
  // Define cases where file extensions don't match the language name
  var langToExt = {
    ruby: 'rb',
    python: 'py',
    perl: 'pl'
  };
  
  lang = langToExt[lang.toLowerCase()] || lang.toLowerCase();
  
  return "proxies/caman_proxy." + lang;
};

// Unique ID generator. Guaranteed to always generate a new ID.
Caman.uniqid = (function () {

  // This ID value is incremented every time get() is called, and can still be accessed
  // by get() at all times because it is included in get()'s closure.
  var id = 0;
  
  return {
    get: function () {
      return id++;
    },
    
    reset: function () {
      id = 0;
    }
  };
}());

Caman.extend(Caman, {
  // Returns the size of an object (the number of properties the object has)
  sizeOf: function ( obj ) {
    var size = 0,
        prop;
    
    for ( prop in obj  ) {
      if (obj.hasOwnProperty(prop)) {
        size++;
      }
    }
            
    return size;
  },
  
  // Determines whether two given objects are the same based on their properties and values.
  sameAs: function ( base, test ) {
    
    // only tests arrays
    // TODO: extend to object tests
    if ( base.length !== test.length ) {
      return false;
    }
    
    for ( var i = base.length; i >= 0; i-- )  {
      if ( base[i] !== test[i] ) {
        return false;
      }
    }
    return true;
  },
  
  // Removes items with the given value from an array if they are present.
  remove: function ( arr, item ) {
    var ret = [];
    
    for ( var i = 0, len = arr.length; i < len; i++ ) {
      if ( arr[i] !== item  ) {
        ret.push(arr[i]);
      }
    }
    
    arr = ret;
    
    return ret;      
  },
  
  // Generates a pseudorandom number that lies within the max - mix range. The number can be either
  // an integer or a float depending on what the user specifies.
  randomRange: function (min, max, float) {
    var rand = min + (Math.random() * (max - min));
    return typeof float == 'undefined' ? Math.round(rand) : rand.toFixed(float);
  },
  
  // Converts an RGB color to HSL.
  // Assumes r, g, and b are in the set [0, 255] and
  // returns h, s, and l in the set [0, 1].
  //
  // <pre>
  // @param   Number  r   Red channel
  // @param   Number  g   Green channel
  // @param   Number  b   Blue channel
  // @return              The HSL representation
  // </pre>
  rgb_to_hsl: function(r, g, b) {
  
    r /= 255;
    g /= 255;
    b /= 255;
    
    var max = Math.max(r, g, b), min = Math.min(r, g, b), 
        h, s, l = (max + min) / 2;
    
    if(max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return {h: h, s: s, l: l};
  },
  
  // Converts from the hue color space back to RGB.
  hue_to_rgb: function (p, q, t) {
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  },
  
  // Converts an HSL color value to RGB. Conversion formula
  // adapted from http://en.wikipedia.org/wiki/HSL_color_space.
  // Assumes h, s, and l are contained in the set [0, 1] and
  // returns r, g, and b in the set [0, 255].
  //
  // <pre>
  // @param   Number  h       The hue
  // @param   Number  s       The saturation
  // @param   Number  l       The lightness
  // @return  Array           The RGB representation
  // </pre>
  hsl_to_rgb: function(h, s, l){
      var r, g, b;
  
      if(s === 0){
          r = g = b = l; // achromatic
      } else {
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = this.hue_to_rgb(p, q, h + 1/3);
          g = this.hue_to_rgb(p, q, h);
          b = this.hue_to_rgb(p, q, h - 1/3);
      }
      
      return {r: r * 255, g: g * 255, b: b * 255};
  },
  
  // Converts an RGB color value to HSV. Conversion formula
  // adapted from http://en.wikipedia.org/wiki/HSV_color_space.
  // Assumes r, g, and b are contained in the set [0, 255] and
  // returns h, s, and v in the set [0, 1].
  //
  // <pre>
  // @param   Number  r       The red color value
  // @param   Number  g       The green color value
  // @param   Number  b       The blue color value
  // @return  Array           The HSV representation
  // </pre>
  rgb_to_hsv: function(r, g, b){
      
      r = r/255;
      g = g/255;
      b = b/255;
      
      var max = Math.max(r, g, b), min = Math.min(r, g, b),
          h, s, v = max,
          d = max - min;
          
      s = max === 0 ? 0 : d / max;
  
      if(max == min){
          h = 0; // achromatic
      } else {
          switch(max){
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
      }
  
      return {h: h, s: s, v: v};
  },
  
  // Converts an HSV color value to RGB. Conversion formula
  // adapted from http://en.wikipedia.org/wiki/HSV_color_space.
  // Assumes h, s, and v are contained in the set [0, 1] and
  // returns r, g, and b in the set [0, 255].
  //
  // <pre>
  // @param   Number  h       The hue
  // @param   Number  s       The saturation
  // @param   Number  v       The value
  // @return  Array           The RGB representation
  // </pre>
  hsv_to_rgb: function(h, s, v){
    
      var r, g, b,
          i = Math.floor(h * 6),
          f = h * 6 - i,
          p = v * (1 - s),
          q = v * (1 - f * s),
          t = v * (1 - (1 - f) * s);
  
      switch(i % 6){
          case 0: 
            r = v;
            g = t;
            b = p;
            break;
          case 1:
            r = q;
            g = v;
            b = p;
            break;
          case 2:
            r = p;
            g = v;
            b = t;
            break;
          case 3:
            r = p;
            g = q;
            b = v;
            break;
          case 4:
            r = t;
            g = p;
            b = v;
            break;
          case 5:
            r = v;
            g = p;
            b = q;
            break;
      }
  
      return {r: r * 255, g: g * 255, b: b * 255};
  },
  
  // Converts a RGB color value to the XYZ color space. Formulas
  // are based on http://en.wikipedia.org/wiki/SRGB assuming that
  // RGB values are sRGB.
  //
  // Assumes r, g, and b are contained in the set [0, 255] and
  // returns x, y, and z.
  //
  // <pre>
  // @param   Number  r       The red color value
  // @param   Number  g       The green color value
  // @param   Number  b       The blue color value
  // @return  Array           The XYZ representation
  // </pre>
  rgb_to_xyz: function (r, g, b) {
  
    r = r / 255; g = g / 255; b = b / 255;
  
    if (r > 0.04045) {
      r = Math.pow((r + 0.055) / 1.055, 2.4);
    } else {
      r = r / 12.92;
    }
  
    if (g > 0.04045) {
      g = Math.pow((g + 0.055) / 1.055, 2.4);
    } else {
      g = g / 12.92;
    }
  
    if (b > 0.04045) {
      b = Math.pow((b + 0.055) / 1.055, 2.4);
    } else {
      b = b / 12.92;
    }
  
    var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  
    return {x: x * 100, y: y * 100, z: z * 100};
  },
  
  // Converts a XYZ color value to the sRGB color space. Formulas
  // are based on http://en.wikipedia.org/wiki/SRGB and the resulting
  // RGB value will be in the sRGB color space.
  // Assumes x, y and z values are whatever they are and returns
  // r, g and b in the set [0, 255].
  //
  // <pre>
  // @param   Number  x       The X value
  // @param   Number  y       The Y value
  // @param   Number  z       The Z value
  // @return  Array           The RGB representation
  // </pre>
  xyz_to_rgb: function (x, y, z) {

    x = x / 100; y = y / 100; z = z / 100;
  
    var r, g, b;
    r = (3.2406  * x) + (-1.5372 * y) + (-0.4986 * z);
    g = (-0.9689 * x) + (1.8758  * y) + (0.0415  * z);
    b = (0.0557  * x) + (-0.2040 * y) + (1.0570  * z);
  
    if(r > 0.0031308) {
      r = (1.055 * Math.pow(r, 0.4166666667)) - 0.055;
    } else {
      r = 12.92 * r;
    }
  
    if(g > 0.0031308) {
      g = (1.055 * Math.pow(g, 0.4166666667)) - 0.055;
    } else {
      g = 12.92 * g;
    }
  
    if(b > 0.0031308) {
      b = (1.055 * Math.pow(b, 0.4166666667)) - 0.055;
    } else {
      b = 12.92 * b;
    }
  
    return {r: r * 255, g: g * 255, b: b * 255};
  },
  
  // Converts a XYZ color value to the CIELAB color space. Formulas
  // are based on http://en.wikipedia.org/wiki/Lab_color_space
  // The reference white point used in the conversion is D65.
  // Assumes x, y and z values are whatever they are and returns
  // L*, a* and b* values
  //
  // <pre>
  // @param   Number  x       The X value
  // @param   Number  y       The Y value
  // @param   Number  z       The Z value
  // @return  Array           The Lab representation
  // </pre>
  xyz_to_lab: function(x, y, z) {
  
    // D65 reference white point
    var whiteX = 95.047, whiteY = 100.0, whiteZ = 108.883;
  
    x = x / whiteX; y = y / whiteY; z = z / whiteZ;
  
    if (x > 0.008856451679) { // (6/29) ^ 3
      x = Math.pow(x, 0.3333333333);
    } else {
      x = (7.787037037 * x) + 0.1379310345; // (1/3) * ((29/6) ^ 2)c + (4/29)
    }
  
    if (y > 0.008856451679) {
      y = Math.pow(y, 0.3333333333);
    } else {
      y = (7.787037037 * y) + 0.1379310345;
    }
  
    if (z > 0.008856451679) {
      z = Math.pow(z, 0.3333333333);
    } else {
      z = (7.787037037 * z) + 0.1379310345;
    }
  
    var l = 116 * y - 16;
    var a = 500 * (x - y);
    var b = 200 * (y - z);
  
    return {l: l, a: a, b: b};
  },
  
  // Converts a L*, a*, b* color values from the CIELAB color space
  // to the XYZ color space. Formulas are based on
  // http://en.wikipedia.org/wiki/Lab_color_space
  //
  // The reference white point used in the conversion is D65.
  // Assumes L*, a* and b* values are whatever they are and returns
  // x, y and z values.
  //
  // <pre>
  // @param   Number  l       The L* value
  // @param   Number  a       The a* value
  // @param   Number  b       The b* value
  // @return  Array           The XYZ representation
  // </pre>
  lab_to_xyz: function(l, a, b) {
  
    var y = (l + 16) / 116;
    var x = y + (a / 500);
    var z = y - (b / 200);
  
    if (x > 0.2068965517) { // 6 / 29
      x = x * x * x;
    } else {
      x = 0.1284185493 * (x - 0.1379310345); // 3 * ((6 / 29) ^ 2) * (c - (4 / 29))
    }
  
    if (y > 0.2068965517) {
      y = y * y * y;
    } else {
      y = 0.1284185493 * (y - 0.1379310345);
    }
  
    if (z > 0.2068965517) {
      z = z * z * z;
    } else {
      z = 0.1284185493 * (z - 0.1379310345);
    }
  
    // D65 reference white point
    return {x: x * 95.047, y: y * 100.0, z: z * 108.883};
  },
  
  // Converts the hex representation of a color to RGB values.
  // Hex value can optionally start with the hash (#).
  //
  // <pre>
  // @param   String  hex   The colors hex value
  // @return  Array         The RGB representation
  // </pre>
  hex_to_rgb: function(hex) {
    var r, g, b;
    
    if (hex.charAt(0) === "#") {
      hex = hex.substr(1);
    }
    
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
    
    return {r: r, g: g, b: b};
  },
  
  // Generates a bezier curve given a start and end point, with two control points in between.
  // Can also optionally bound the y values between a low and high bound.
  //
  // This is different than most bezier curve functions because it attempts to construct it in such 
  // a way that we can use it more like a simple input -> output system, or a one-to-one function. 
  // In other words we can provide an input color value, and immediately receive an output modified color value.
  bezier: function (start, ctrl1, ctrl2, end, lowBound, highBound) {
    var Ax, Bx, Cx, Ay, By, Cy,
    x0 = start[0], y0 = start[1],
    x1 = ctrl1[0], y1 = ctrl1[1],
    x2 = ctrl2[0], y2 = ctrl2[1],
    x3 = end[0], y3 = end[1],
    t, curveX, curveY,
    bezier = {};
    
    // Calculate our X and Y coefficients
    Cx = 3 * (x1 - x0);
    Bx = 3 * (x2 - x1) - Cx;
    Ax = x3 - x0 - Cx - Bx;
    
    Cy = 3 * (y1 - y0);
    By = 3 * (y2 - y1) - Cy;
    Ay = y3 - y0 - Cy - By;
    
    // 1000 is actually arbitrary. We need to make sure we do enough calculations between 0 and 255 that, in even
    // the more extreme circumstances, we calculate as many values as possible. In the event that an X value is
    // skipped, it will be found later on.
    for (var i = 0; i < 1000; i++) {
      t = i / 1000;
      
      // Calculate our X and Y values for this iteration
      curveX = Math.round((Ax * Math.pow(t, 3)) + (Bx * Math.pow(t, 2)) + (Cx * t) + x0);
      curveY = Math.round((Ay * Math.pow(t, 3)) + (By * Math.pow(t, 2)) + (Cy * t) + y0);
      
      if (lowBound && curveY < lowBound) {
        curveY = lowBound;
      } else if (highBound && curveY > highBound) {
        curveY = highBound;
      }
      
      // Store the calculation
      bezier[curveX] = curveY;
    }
    
    // Do a search for missing values in the bezier array and use linear interpolation
    // to approximate their values.
    var leftCoord, rightCoord, j, slope, bint;
    if (bezier.length < end[0] + 1) {
      for (i = 0; i <= end[0]; i++) {
        if (typeof bezier[i] === "undefined") {
          // The value to the left will always be defined. We don't have to worry about
          // when i = 0 because the starting point is guaranteed (I think...)
          leftCoord = [i-1, bezier[i-1]];
          
          // Find the first value to the right that was found. Ideally this loop will break
          // very quickly.
          for (j = i; j <= end[0]; j++) {
            if (typeof bezier[j] !== "undefined") {
              rightCoord = [j, bezier[j]];
              break;
            }
          }
          
          // Store the value discovered with linear interpolation
          bezier[i] = leftCoord[1] + ((rightCoord[1] - leftCoord[1]) / (rightCoord[0] - leftCoord[0])) * (i - leftCoord[0]);
        }
      }
    }
    
    // Edge case
    if (typeof bezier[end[0]] === "undefined") {
      bezier[end[0]] = bezier[254];
    }
    
    return bezier;
  },
  
  // Calculate the distance between two points on a cartesian plane.
  distance: function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
});

}(Caman));
// As the name suggests, this piece of code is responsible for handling saving and exporting images from the 
// Caman-initialized canvas element.
//
// The save() function prompts the user to download the image. The toImage() function simply converts the 
// canvas element back into an image element. Once this happens, Caman needs to be re-initialized in order 
// to edit the image further. toBase64() is simply a helper that converts the canvas data to a base64 representation.

/*global Caman: true */ 
(function (Caman) {

// Path to the remote image proxy, if any.
Caman.remoteProxy = "";

Caman.extend(Caman.manip, {
  // Grabs the canvas data, encodes it to Base64, then sets the browser location to the encoded data so that
  // the user will be prompted to download it.
  save: function (type) {
    if (type) {
      // Force filetype to lowercase for consistency
      type = type.toLowerCase();
    }
    
    // If no valid type is given, default to PNG
    if (!type || (type !== 'png' && type !== 'jpg')) {
      type = 'png';
    }
    
    // Redirect to a URL containing the base64 image data, which should (in most cases) cause the browser
    // to prompt the user with a download.
    document.location.href = this.toBase64(type).replace("image/" + type, "image/octet-stream");
  },
  
  // Takes the current canvas data, converts it to Base64, then sets it as the source of a new Image object
  // and returns it.
  toImage: function (type) {
    var img;
    
    img = document.createElement('img');
    img.src = this.toBase64(type);
    
    return img;
  },
  
  // Grabs the current canvas data and Base64 encodes it.
  toBase64: function (type) {
    if (type) {
      type = type.toLowerCase();
    }
    
    if (!type || (type !== 'png' && type !== 'jpg')) {
      type = 'png';
    }
    
    return this.canvas.toDataURL("image/" + type);
  }
});

}(Caman));
// The event system in Caman is responsible for registering and firing events at 
// certain points during the render process. It is fairly straightforward and consists
// of a listen() and trigger() function.
//
// The listen() function takes a type (string describing what event to listen for) and a
// callback that is fired when the event occurs. The trigger() function takes a type 
// (name of the event) and some optional data to pass to the registered callbacks that will be fired.

/*global Caman: true */ 
(function (Caman) {

Caman.events  = {
  types: [ "processStart", "processComplete", "renderFinished" ],
  fn: {
    
    // Triggers an event with the given target name.
    // The target argument can often be omitted if you want
    // to listen to events from all Caman instances on the page.
    trigger: function ( target, type, data ) {
      
      var _target = target, _type = type, _data = data;
    
      // Adjust the arguments if target is omitted.
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _data = type;
      }
    
      if ( Caman.events.fn[_type] && Caman.sizeOf(Caman.events.fn[_type]) ) {
        // Iterate over all of the registered callbacks
        Caman.forEach(Caman.events.fn[_type], function ( obj, key ) {
          // Call the event callback with the context set to the Caman
          // object that fired the event.
          obj.call(_target, _data);
        });
      }
    },
    
    // Registers a callback function to be fired when a certain
    // event occurs.
    listen: function ( target, type, fn ) {

      var _target = target, _type = type, _fn = fn;
    
      // Adjust the arguments if the target is omitted
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _fn = type;
      }        

      // If an event of this type hasn't been defined before, define it now.
      if ( !Caman.events.fn[_type] ) {
        Caman.events.fn[_type] = [];
      }

      // Add the event to the callback array
      Caman.events.fn[_type].push(_fn);
      
      return true;
    }
  },
  cache: {} 
};
  
// Enable easier access to the events system via the main Caman object
Caman.forEach( ["trigger", "listen"], function ( key ) {
  Caman[key] = Caman.events.fn[key];
});
  
})(Caman);
// The pixelInfo object. This object is available inside of the
// process() loop, and it lets filter developers have simple access
// to any arbitrary pixel in the image, as well as information about
// the current pixel in the loop.

/*global Caman: true */ 
(function (Caman) {

// Allows the currently rendering filter to get data about
// surrounding pixels relative to the pixel currently being
// processed. The data returned is identical in format to the
// rgba object provided in the process function.
//
// Example: to get data about the pixel to the top-right
// of the currently processing pixel, you can call (within the process
// function):
// <pre>this.getPixelRelative(1, -1);</pre>
Caman.manip.pixelInfo = function (self) {
  this.loc = 0;
  this.manip = self;
};

// Retrieves the X, Y location of the current pixel. The origin is at the bottom left
// corner of the image, like a normal coordinate system.
Caman.manip.pixelInfo.prototype.locationXY = function () {
  var x, y;
  
  // This was a serious pain in the ass to get right. Since the pixel array is a simple
  // 1-dimensional array (and for good reason) we have to do some math-y magic to calculate
  // our current X, Y position.
  y = this.manip.dimensions.height - Math.floor(this.loc / (this.manip.dimensions.width * 4));
  x = ((this.loc % (this.manip.dimensions.width * 4)) / 4);
  
  return {x: x, y: y};
};

// Returns an RGBA object for a pixel whose location is specified in relation to the current pixel.
Caman.manip.pixelInfo.prototype.getPixelRelative = function (horiz_offset, vert_offset) {
  // We invert the vert_offset in order to make the coordinate system non-inverted. In laymans
  // terms: -1 means down and +1 means up.
  var newLoc = this.loc + (this.manip.dimensions.width * 4 * (vert_offset * -1)) + (4 * horiz_offset);
  
  // Error handling
  if (newLoc > this.manip.pixel_data.length || newLoc < 0) {
    return {r: 0, g: 0, b: 0, a: 0};
  }
  
  return {
    r: this.manip.pixel_data[newLoc],
    g: this.manip.pixel_data[newLoc+1],
    b: this.manip.pixel_data[newLoc+2],
    a: this.manip.pixel_data[newLoc+3]
  };
};

// The counterpart to getPixelRelative, this updates the value of a pixel whose location is specified in
// relation to the current pixel.
Caman.manip.pixelInfo.prototype.putPixelRelative = function (horiz_offset, vert_offset, rgba) {
  var newLoc = this.loc + (this.manip.dimensions.width * 4 * (vert_offset * -1)) + (4 * horiz_offset);
  
  // Error handling
  if (newLoc > this.manip.pixel_data.length || newLoc < 0) {
    return false;
  }
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] = rgba.a;
};

// Gets an RGBA object for an arbitrary pixel in the canvas specified by absolute X, Y coordinates
Caman.manip.pixelInfo.prototype.getPixel = function (x, y) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  return {
    r: this.manip.pixel_data[newLoc],
    g: this.manip.pixel_data[newLoc+1],
    b: this.manip.pixel_data[newLoc+2],
    a: this.manip.pixel_data[newLoc+3]
  };
};

// Updates the pixel at the given X, Y coordinates  
Caman.manip.pixelInfo.prototype.putPixel = function (x, y, rgba) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] = rgba.a;
};

}(Caman));
// CamanJS's rendering system. This covers convolution kernels,
// pixel-wise filters, and plugins. All of the actual pixel/image
// manipulation is executed here when render() is called.

/*global Caman: true */
(function (Caman) {

// Defines how many slices we want to split the canvas up into for rendering.
// While Javascript is not multi-threaded, it does help to make each rendering
// job shorter, and to allow the browser more control in managing the render jobs.
Caman.renderBlocks = 4;

// * SINGLE = traverse the image 1 pixel at a time
// * KERNEL = traverse the image using convolution kernels
// * LAYER_DEQUEUE = shift a layer off the canvasQueue
// * LAYER_FINISHED = finished processing a layer
// * LOAD_OVERLAY = load a local/remote image into the layer canvas
// * PLUGIN = executes a plugin function that isn't pixelwise or kernel
Caman.ProcessType = {
  SINGLE: 1,
  KERNEL: 2,
  LAYER_DEQUEUE: 3,
  LAYER_FINISHED: 4,
  LOAD_OVERLAY: 5,
  PLUGIN: 6
};

Caman.manip.process = function (adjust, processFn) {
  // Since the block-based renderer is asynchronous, we simply build
  // up a render queue and execute the filters in order once
  // render() is called instead of executing them as they're called
  // synchronously.
  this.renderQueue.push({adjust: adjust, processFn: processFn, type: Caman.ProcessType.SINGLE});
  
  return this;
};

// Process info about kernel and store it for later rendering.
Caman.manip.processKernel = function (name, adjust, divisor, bias) {  
  if (!divisor) {
    // No divisor provided, so we need to calculate the default
    divisor = 0;

    // The divisor is the sum of all the values in the convolution matrix
    for (var i = 0, len = adjust.length; i < len; i++) {
      divisor += adjust[i];
    }
  }
  
  // Store all of the info for this kernel in an object for later retrieval
  var data = {
    name: name,
    adjust: adjust,
    divisor: divisor,
    bias: bias || 0
  };
  
  // Add the convolution to the render queue and move on
  this.renderQueue.push({adjust: data, processFn: Caman.processKernel, type: Caman.ProcessType.KERNEL});
  
  return this;
};

// Process an advanced plugin and add it to the render queue. Not much to do here since so much
// of the control lies with the plugin itself.
Caman.manip.processPlugin = function (plugin, args) {
  this.renderQueue.push({type: Caman.ProcessType.PLUGIN, plugin: plugin, args: args});
  return this;
};

// Executes an advanced plugin. Simply calls the plugin function while setting the context to
// the manip object.
Caman.manip.executePlugin = function (plugin, args) {
  console.log("Executing plugin: " + plugin);
  Caman.plugin[plugin].apply(this, args);
  console.log("Plugin " + plugin + " finished!");
  
  // Continue to the next rendering operation
  this.processNext();
};

// Begins the render process if it's not started, or moves to the next
// filter in the queue and processes it. Calls the finishedFn callback
// when the render queue is empty.
Caman.manip.processNext = function (finishedFn) {
  if (typeof finishedFn === "function") {
    // Since this function is indirectly recursive, it would be a pain to pass the processFn
    // around each time. Instead, we simply store it with the manip object for later usage.
    this.finishedFn = finishedFn;
  }
  
  // Rendering is complete when the render queue is empty
  if (this.renderQueue.length === 0) {
    // Trigger the render finished event
    Caman.trigger("renderFinished", {id: this.canvas_id});
    
    // If we have a render finished callback, execute it now
    if (typeof this.finishedFn === "function") {
      this.finishedFn.call(this);
    }
    
    return;
  }
  
  // Retrive the next operation from the render queue
  var next = this.renderQueue.shift();
  
  if (next.type == Caman.ProcessType.LAYER_DEQUEUE) {
    // New layer operative. Shift the next layer off the canvas queue and execute 
    // it's transformations.
    var layer = this.canvasQueue.shift();
    this.executeLayer(layer);
    
  } else if (next.type == Caman.ProcessType.LAYER_FINISHED) {
    // Layer is finished rendering. Blend it with the parent layer, change context back to
    // the parent layer, and move onto the next operation.
    this.applyCurrentLayer();
    this.popContext();
    this.processNext();
    
  } else if (next.type == Caman.ProcessType.LOAD_OVERLAY) {
    // Load an image to be used as a layer overlay.
    this.loadOverlay(next.layer, next.src);
    
  } else if (next.type == Caman.ProcessType.PLUGIN) {
    
    // Execute an advanced plugin
    this.executePlugin(next.plugin, next.args);
    
  } else {
    // Execute a normal pixel-wise filter and apply it to the current layer/canvas
    this.executeFilter(next.adjust, next.processFn, next.type);
  }
};

Caman.extend( Caman, {  
  // Convolution kernel rendering. Given an array of pixels based on the current location in the
  // rendering process, and a convolution matrix, calculate the new value of the kernel.
  processKernel: function (adjust, kernel, divisor, bias) {
    var val = {r: 0, g: 0, b: 0};
    
    // Loop through each pixel in the kernel and apply it to the matching pixel in the matrix
    // from the image.
    for (var i = 0, len = adjust.length; i < len; i++) {
      val.r += adjust[i] * kernel[i * 3];
      val.g += adjust[i] * kernel[i * 3 + 1];
      val.b += adjust[i] * kernel[i * 3 + 2];
    }
    
    // Finally, apply the divisor and the bias to the calculated kernel
    val.r = (val.r / divisor) + bias;
    val.g = (val.g / divisor) + bias;
    val.b = (val.b / divisor) + bias;

    return val;
  }
});

// The core of the image rendering, this function executes
// the provided filter and updates the canvas pixel data
// accordingly.
//
// NOTE: this does not write the updated pixel
// data to the canvas. That happens when all filters are finished
// rendering in order to be as fast as possible.
Caman.manip.executeFilter = function (adjust, processFn, type) {
  // Shortcut to the length of the pixel array
  var n = this.pixel_data.length,
  
  // (n/4) == # of pixels in image
  // Give remaining pixels to last block in case it doesn't
  // divide evenly.
  blockPixelLength = Math.floor((n / 4) / Caman.renderBlocks),
  
  // expand it again to make the loop easier.
  blockN = blockPixelLength * 4,
  
  // add the remainder pixels to the last block.
  lastBlockN = blockN + ((n / 4) % Caman.renderBlocks) * 4,

  // Stupid context proxying >.>
  self = this,
  
  // Keep track of how many blocks are done so we know when rendering finishes
  blocks_done = 0,
  
  // Called whenever a block finishes. It's used to determine when all blocks
  // finish rendering.
  block_finished = function (bnum) {
    if (bnum >= 0) {
      console.log("Block #" + bnum + " finished! Filter: " + processFn.name);
    }
    
    blocks_done++;

    // All blocks finished rendering
    if (blocks_done == Caman.renderBlocks || bnum == -1) {
      if (bnum >= 0) {
        console.log("Filter " + processFn.name + " finished!");
      } else {
        // Due to the nature of convolution, it does not divide the image into blocks
        console.log("Kernel filter finished!");
      }
      
      Caman.trigger("processComplete", {id: self.canvas_id, completed: processFn.name});
      
      // Since this filter is finished, it's time to move on to the next render operation
      self.processNext();
    }
  },
  
  //Renders a block of the image bounded by the start and end parameters.
  render_block = function (bnum, start, end) {
    console.log("BLOCK #" + bnum + " - Filter: " + processFn.name + ", Start: " + start + ", End: " + end);
    
    var renderFunc = function () {
      // Create an RGB object to pass to the filter functions
      var data = {r: 0, g: 0, b: 0, a: 0};
      
      // Prepare the PixelInfo object
      var pixelInfo = new this.pixelInfo(self);
      var res;
      
      for (var i = start; i < end; i += 4) {
        // Set the location of the pixelInfo object to the current pixel
        pixelInfo.loc = i;
        
        // Update the values of the RGB object
        data.r = this.pixel_data[i];
        data.g = this.pixel_data[i+1];
        data.b = this.pixel_data[i+2];
        
        // Execute the filter!
        res = processFn.call(pixelInfo, adjust, data);
        
        // Apply the modified RGB object to the current pixel array. These values are automatically clamped in
        // order to conform to the latest canvas spec.
        this.pixel_data[i]   = Caman.clampRGB(res.r);
        this.pixel_data[i+1] = Caman.clampRGB(res.g);
        this.pixel_data[i+2] = Caman.clampRGB(res.b);
      }
      
      // Signal that this block is finished rendering
      block_finished(bnum);
    }.bind(this);
    
    // Begin rendering asynchronously
    setTimeout(renderFunc, 0);
  },
  
  // Renders a convolution matrix. This is admittedly confusing, especially since it was designed with
  // flexibility in mind. Bear with me here.
  render_kernel = function () {
  
    // Function that executes the rendering process
    var renderFunc = function () {
      var kernel = [],
      pixelInfo, pixel,
      start, end, 
      mod_pixel_data,
      name = adjust.name,
      bias = adjust.bias,
      divisor = adjust.divisor,
      adjustSize,
      builder, builder_index,
      i, j, k, res;
      
      // Simple shortcut
      adjust = adjust.adjust;
      
      // The size of one side of the convolutinon matrix is simply the square root (matrix must be square)
      adjustSize = Math.sqrt(adjust.length);
      
      // Will store the modified pixel data since we can't directly update the original pixel array while
      // simultaneously modifing it.
      mod_pixel_data = [];
      
      console.log("Rendering kernel - Filter: " + name);
      
      // Calculate the beginning and end of the pixel array loop
      start = self.dimensions.width * 4 * ((adjustSize - 1) / 2);
      end = n - (self.dimensions.width * 4 * ((adjustSize - 1) / 2));
      
      // Calculate the index for the kernel we're going to generate for the current pixel. This is where it
      // begins to get confusing.
      builder = (adjustSize - 1) / 2;
      
      // Set our pixelInfo object so we can easily grab pixels for the kernel.
      pixelInfo = new self.pixelInfo(self);
      
      for (i = start; i < end; i += 4) {
        pixelInfo.loc = i;
        
        builder_index = 0;

        // This generates the kernel for the current pixel based on the size of the provided convolution matrix.
        for (j = -builder; j <= builder; j++) {
          for (k = builder; k >= -builder; k--) {
            pixel = pixelInfo.getPixelRelative(j, k);
            kernel[builder_index * 3]     = pixel.r;
            kernel[builder_index * 3 + 1] = pixel.g;
            kernel[builder_index * 3 + 2] = pixel.b;
            
            builder_index++;
          }
        }
                
        // Execute the kernel processing function
        res = processFn.call(pixelInfo, adjust, kernel, divisor, bias);

        // Update the new pixel array since we can't modify the original
        // until the convolutions are finished on the entire image.
        mod_pixel_data[i]   = Caman.clampRGB(res.r);
        mod_pixel_data[i+1] = Caman.clampRGB(res.g);
        mod_pixel_data[i+2] = Caman.clampRGB(res.b);
        mod_pixel_data[i+3] = 255;
      }

      // Update the actual canvas pixel data. Unfortunately we have to set
      // this one by one or else it won't work properly.
      for (i = start; i < end; i++) {
        self.pixel_data[i] = mod_pixel_data[i];
      }
      
      // Signal that the kernel is done rendering.
      block_finished(-1);
      
    }.bind(this);
    
    // Begin rendering the kernel asychronously
    setTimeout(renderFunc, 0);
  };
  
  Caman.trigger("processStart", {id: this.canvas_id, start: processFn.name});
  
  // Decide which type of filter we have to render.
  if (type === Caman.ProcessType.SINGLE) {
    // Split the image into its blocks.
    for (var j = 0; j < Caman.renderBlocks; j++) {
      // Calculate the start and end for this image block.
      var start = j * blockN,
      
      // If this is the last block and there is some remainder, add it here.
      end = start + ((j == Caman.renderBlocks - 1) ? lastBlockN : blockN);
      
      // Begin rendering
      render_block.call(this, j, start, end);
    }
  } else {
    // Render the kernel
    render_kernel.call(this);
  }
};

Caman.extend(Caman.manip, {
  // Reverts an image back to its original state by re-initializing Caman
  revert: function (ready) {
    this.loadCanvas(this.options.image, this.options.canvas, ready);
  },
  
  // The render function that the user uses in order to begin the rendering process.
  // Once all the rendering is complete, it applies the updated pixel data to the canvas
  // and calls the finished callback (if any).
  render: function (callback) {
    this.processNext(function () {
      this.context.putImageData(this.image_data, 0, 0);
      
      if (typeof callback === 'function') {
        callback.call(this);
      }
    });    
  }
});

}(Caman));
// The entire layering system for Caman resides in this file. Layers get their own canvasLayer object 
// which is created when newLayer() is called. For extensive information regarding the specifics of how 
// the layering system works, there is an in-depth blog post on this very topic. Instead of copying the 
// entirety of that post, I'll simply point you towards the blog link.
//
// However, the gist of the layering system is that, for each layer, it creates a new canvas element and 
// then either copies the parent layer's data or applies a solid color to the new layer. After some (optional) 
// effects are applied, the layer is blended back into the parent canvas layer using one of many different 
// blending algorithms.
//
// You can also load an image (local or remote, with a proxy) into a canvas layer, which is useful if you want 
// to add textures to an image.

/*global Caman: true */
(function (Caman) {

// Loads another image into a canvas layer that can be either local or remote (with a proxy). This function is
// executed at render time so that the end-user doesn't have to worry about the image loading asynchronously.
Caman.manip.loadOverlay = function (layer, src) {
  var proxyUrl = Caman.remoteCheck(src),
  self = this;
  
  // Apply the proxy if the image is remote and a proxy exists.
  if (proxyUrl) {
    src = proxyUrl;
  }
  
  // Create an image element, apply the URL, and wait for load
  var img = document.createElement('img');
  img.onload = function () {
    // Once the image loads, draw it on to the layer's canvas.
    layer.context.drawImage(img, 0, 0, self.dimensions.width, self.dimensions.height);
    layer.image_data = layer.context.getImageData(0, 0, self.dimensions.width, self.dimensions.height);
    layer.pixel_data = layer.image_data.data;
    
    self.pixel_data = layer.pixel_data;
    
    // Done! Move to the next render operative
    self.processNext();
  };
  
  img.src = src;
};

// Object that represents a canvas layer
Caman.manip.canvasLayer = function (manip) {  
  // Default options
  this.options = {
    blendingMode: 'normal',
    opacity: 1.0
  };
  
  // Create a blank and invisible canvas. We store the reference to the canvas as a part of the canvasLayer
  // object instead of appending it to the DOM.
  this.layerID = Caman.uniqid.get();
  this.canvas = document.createElement('canvas');
  
  // Give the canvas the same dimensions as the parent canvas
  this.canvas.width = manip.dimensions.width;
  this.canvas.height = manip.dimensions.height;
  
  this.context = this.canvas.getContext("2d");
  this.context.createImageData(this.canvas.width, this.canvas.height);
  this.image_data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  this.pixel_data = this.image_data.data;

  // Define a getter for filter that returns the manip object so that we can use all of the normal
  // filters on this layer.
  this.__defineGetter__("filter", function () {
    return manip;
  });

  return this;
};

// Enables nesting of layers since this calls the newLayer function from the manip object, but
// changes the context of `this` to this layer instead of the original parent canvas.
Caman.manip.canvasLayer.prototype.newLayer = function (callback) {
  return this.filter.newLayer.call(this.filter, callback);
};

// Sets the blending mode to one of the defined blenders
Caman.manip.canvasLayer.prototype.setBlendingMode = function (mode) {
  this.options.blendingMode = mode;
  return this;
};

// Sets the opacity of the layer, which dictates how much of the layer is applied during blending.
Caman.manip.canvasLayer.prototype.opacity = function (opacity) {
  this.options.opacity = (opacity / 100);
  return this;
};

// Copies the contents of the parent layer to this layer.
Caman.manip.canvasLayer.prototype.copyParent = function () {
  // Grab the pixel data from the parent layer
  var parentData = this.filter.pixel_data;
  
  // Unfortunately we can't set this all at once since (I believe) that would create a reference
  // to the parent pixel array instead of copying the data. By directly setting the individual
  // primitive values, they become copied.
  for (var i = 0; i < this.pixel_data.length; i += 4) {
    this.pixel_data[i]    = parentData[i];
    this.pixel_data[i+1]  = parentData[i+1];
    this.pixel_data[i+2]  = parentData[i+2];
    this.pixel_data[i+3]  = parentData[i+3];
  }
  
  return this;
};

// Shortcut for flooding this layer with a solid color
Caman.manip.canvasLayer.prototype.fillColor = function () {
  this.filter.fillColor.apply(this.filter, arguments);
  return this;
};

// Load a remote image and overlay it on this layer. The image will be downloaded and applied at render-time,
// so this function is not asynchronous.
Caman.manip.canvasLayer.prototype.overlayImage = function (image) {
  if (image[0] == '#') {
    // If the given image is a DOM ID instead of a URL
    image = Caman.$(image).src;
  } else if (typeof image === "object") {
    // If the given image is a DOM image object
    image = image.src;
  }
  
  // Some problem, skip to prevent errors
  if (!image) return;
  
  this.filter.renderQueue.push({type: Caman.ProcessType.LOAD_OVERLAY, src: image, layer: this});
  
  return this;
};

// Leaving this here for compatibility reasons. It is NO
// LONGER REQUIRED at the end of the layer.
Caman.manip.canvasLayer.prototype.render = function () {};

// Apply the content of this layer to the parent layer. This occurs at render time and should never be directly
// called by the user.
Caman.manip.canvasLayer.prototype.applyToParent = function () {
  // Grab the parent's pixel data off of the pixel stack
  var parentData = this.filter.pixelStack[this.filter.pixelStack.length - 1],
  layerData = this.filter.pixel_data,
  rgbaParent = {},
  rgbaLayer = {},
  result = {};

  for (var i = 0; i < layerData.length; i += 4) {
    // Create an RGBA object for the parent layer
    rgbaParent = {
      r: parentData[i],
      g: parentData[i+1],
      b: parentData[i+2],
      a: parentData[i+3]
    };
    
    // Create an RGBA object for this layer
    rgbaLayer = {
      r: layerData[i],
      g: layerData[i+1],
      b: layerData[i+2],
      a: layerData[i+3]
    };
    
    // Send the parent and layer RGBA data for this pixel to the specified blender
    result = this.blenders[this.options.blendingMode](rgbaLayer, rgbaParent);
    
    // Clamp the RGB values to follow the latest canvas spec.
    result.r = Caman.clampRGB(result.r);
    result.g = Caman.clampRGB(result.g);
    result.b = Caman.clampRGB(result.b);
    
    parentData[i]   = rgbaParent.r - ((rgbaParent.r - result.r) * (this.options.opacity * (result.a / 255)));
    parentData[i+1] = rgbaParent.g - ((rgbaParent.g - result.g) * (this.options.opacity * (result.a / 255)));
    parentData[i+2] = rgbaParent.b - ((rgbaParent.b - result.b) * (this.options.opacity * (result.a / 255)));
  }
};

// Built-in layer blenders. Many of these mimic Photoshop blend modes.
Caman.manip.canvasLayer.prototype.blenders = {

  // Directly apply the child layer's pixels to the parent layer with no special changes
  normal: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaLayer.r,
      g: rgbaLayer.g,
      b: rgbaLayer.b,
      a: rgbaLayer.a
    };
  },
  
  // Apply the child to the parent by multiplying the color values. This generally creates contrast.
  multiply: function (rgbaLayer, rgbaParent) {
    return {
      r: (rgbaLayer.r * rgbaParent.r) / 255,
      g: (rgbaLayer.g * rgbaParent.g) / 255,
      b: (rgbaLayer.b * rgbaParent.b) / 255,
      a: rgbaLayer.a
    };
  },
  
  screen: function (rgbaLayer, rgbaParent) {
    return {
      r: 255 - (((255 - rgbaLayer.r) * (255 - rgbaParent.r)) / 255),
      g: 255 - (((255 - rgbaLayer.g) * (255 - rgbaParent.g)) / 255),
      b: 255 - (((255 - rgbaLayer.b) * (255 - rgbaParent.b)) / 255),
      a: rgbaLayer.a
    };
  },
  
  overlay: function (rgbaLayer, rgbaParent) {
    var result = {};
    result.r = 
      (rgbaParent.r > 128) ? 
        255 - 2 * (255 - rgbaLayer.r) * (255 - rgbaParent.r) / 255: 
        (rgbaParent.r * rgbaLayer.r * 2) / 255;
        
    result.g = 
      (rgbaParent.g > 128) ? 
        255 - 2 * (255 - rgbaLayer.g) * (255 - rgbaParent.g) / 255: 
        (rgbaParent.g * rgbaLayer.g * 2) / 255;
        
    result.b = 
      (rgbaParent.b > 128) ? 
        255 - 2 * (255 - rgbaLayer.b) * (255 - rgbaParent.b) / 255: 
        (rgbaParent.b * rgbaLayer.b * 2) / 255;
    
    result.a = rgbaLayer.a;
    return result;
  },
  
  difference: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaLayer.r - rgbaParent.r,
      g: rgbaLayer.g - rgbaParent.g,
      b: rgbaLayer.b - rgbaParent.b,
      a: rgbaLayer.a
    };
  },
  
  addition: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaParent.r + rgbaLayer.r,
      g: rgbaParent.g + rgbaLayer.g,
      b: rgbaParent.b + rgbaLayer.b,
      a: rgbaLayer.a
    };
  },
  
  exclusion: function (rgbaLayer, rgbaParent) {
    return {
      r: 128 - 2 * (rgbaParent.r - 128) * (rgbaLayer.r - 128) / 255,
      g: 128 - 2 * (rgbaParent.g - 128) * (rgbaLayer.g - 128) / 255,
      b: 128 - 2 * (rgbaParent.b - 128) * (rgbaLayer.b - 128) / 255,
      a: rgbaLayer.a
    };
  },
  
  softLight: function (rgbaLayer, rgbaParent) {
    var result = {};
    
    result.r = 
      (rgbaParent.r > 128) ? 
        255 - ((255 - rgbaParent.r) * (255 - (rgbaLayer.r - 128))) / 255 : 
        (rgbaParent.r * (rgbaLayer.r + 128)) / 255;
      
    result.g = 
      (rgbaParent.g > 128) ? 
        255 - ((255 - rgbaParent.g) * (255 - (rgbaLayer.g - 128))) / 255 : 
        (rgbaParent.g * (rgbaLayer.g + 128)) / 255;
    
    result.b = (rgbaParent.b > 128) ? 
      255 - ((255 - rgbaParent.b) * (255 - (rgbaLayer.b - 128))) / 255 : 
      (rgbaParent.b * (rgbaLayer.b + 128)) / 255;
      
    result.a = rgbaLayer.a;
    return result;
  }
};

// Add the blenders object to the Caman.manip namespace to make it easier to extend.
Caman.manip.blenders = Caman.manip.canvasLayer.prototype.blenders;

// Queue that holds all of the layers that are waiting to be rendered
Caman.manip.canvasQueue = [];

// Factory method that creates a new layer and adds the layer to the render queue once
// all of the modifications are defined via the callback.
Caman.manip.newLayer = function (callback) {
  var layer = new Caman.manip.canvasLayer(this);
  
  // Store the new layer in the canvas queue for rendering later
  this.canvasQueue.push(layer);

  // Inform the renderer that we have a new layer coming up
  this.renderQueue.push({type: Caman.ProcessType.LAYER_DEQUEUE});  
  
  // Define the layer transformations
  callback.call(layer);
  
  // Let the renderer know the layer is finished
  this.renderQueue.push({type: Caman.ProcessType.LAYER_FINISHED});

  return this;
};

// Used during the rendering process. Directly correlates to the LAYER_DEQUEUE render event.
Caman.manip.executeLayer = function (layer) {
  this.pushContext(layer);
  this.processNext();
};

// Changes the rendering context to the upcoming layer for rendering.
Caman.manip.pushContext = function (layer) {
  console.log("PUSH LAYER!");
  
  // Push the layer onto the layer stack for processing
  this.layerStack.push(this.currentLayer);
  
  // Also push the pixel array into its own stack
  this.pixelStack.push(this.pixel_data);
  
  // Set the reference to the current layer
  this.currentLayer = layer;
  
  // Set the current pixel data array to the layer's pixel data
  this.pixel_data = layer.pixel_data;
};

// Once we are done rendering a layer, we can move back to the parent layer's context. This directly
// correlates to the LAYER_FINISHED render event.
Caman.manip.popContext = function () {
  console.log("POP LAYER!");
  
  // Restore the parent's pixel data (which has been modified by a blending function)
  this.pixel_data = this.pixelStack.pop();
  
  // Restore the reference to the current layer
  this.currentLayer = this.layerStack.pop();
};

// Shortcut for applying the current layer to the parent layer
Caman.manip.applyCurrentLayer = function () {
  this.currentLayer.applyToParent();
};

}(Caman));
// The filters define all of the built-in functionality that comes with Caman 
// (as opposed to being provided by a plugin). All of these filters are rather 
// basic, but are extremely powerful when many are combined. For information on 
// creating plugins, check out the [Plugin Creation](http://camanjs.com/docs/plugin-creation)
// page, and for information on using the plugins, check out the
// [Built-In Functionality](http://camanjs.com/docs/built-in) page.

/*global Caman: true */ 
(function(Caman) {
  
  // ## Fill Color
  // Fills the canvas with a single solid color.
  // 
  // ### Arguments
  // Can take either separate R, G, and B values as arguments, or a single hex color value.
  Caman.manip.fillColor = function () {
    var color;
    if (arguments.length == 1) {
      // If there's only 1 argument present, assume its a hex color and convert it to RGB.
      color = Caman.hex_to_rgb(arguments[0]);
    } else {
      color = {
        r: arguments[0],
        g: arguments[1],
        b: arguments[2]
      };
    }
    
    // Simply set every pixel in the canvas to the given RGB color.
    return this.process( color, function fillColor(color, rgba) {
      rgba.r = color.r;
      rgba.g = color.g;
      rgba.b = color.b;
      
      return rgba;
    });
  };

  // ## Brightness
  // Simple brightness adjustment
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will darken image while values > 0 will brighten.
  Caman.manip.brightness = function(adjust) {
    adjust = Math.floor(255 * (adjust / 100));
    
    // Simply increase all 3 color channels by the given amount
    return this.process( adjust,  function brightness(adjust, rgba) {
      rgba.r += adjust;
      rgba.g += adjust;
      rgba.b += adjust;
      
      return rgba;
    });
  };

  // ## Saturation
  // Adjusts the color saturation of the image.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will desaturate the image while values > 0 will saturate it.
  // **If you want to completely desaturate the image**, using the greyscale filter is highly 
  // recommended because it will yield better results.
  Caman.manip.saturation = function(adjust) {
    var max, diff;
    adjust *= -0.01;
    
    return this.process( adjust, function saturation(adjust, rgba) {
      var chan;
      
      // Find the max value across all 3 channels
      max = Math.max(rgba.r, rgba.g, rgba.b);
      
      // Go through each channel, and if it isn't the max, adjust it by the given amount.
      if (rgba.r !== max) {
        diff = max - rgba.r;
        rgba.r += diff * adjust;
      }
      
      if (rgba.g !== max) {
        diff = max - rgba.g;
        rgba.g += diff * adjust; 
      }
      
      if (rgba.b !== max) {
        diff = max - rgba.b;
        rgba.b += diff * adjust;
      }
      
      return rgba;
    });
  };
  
  // ## Vibrance
  // Similar to saturation, but adjusts the saturation levels in a slightly smarter, more subtle way. 
  // Vibrance will attempt to boost colors that are less saturated more and boost already saturated
  // colors less, while saturation boosts all colors by the same level.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will desaturate the image while values > 0 will saturate it.
  // **If you want to completely desaturate the image**, using the greyscale filter is highly recommended
  // because it will yield better results.
  Caman.manip.vibrance = function (adjust) {
    var max, avg, amt, diff;
    adjust *= -1;
    
    return this.process( adjust, function vibrance(adjust, rgba) {
      var chan;
      
      // Find the max value across all 3 channels
      max = Math.max(rgba.r, rgba.g, rgba.b);
      
      // Calculate difference between max color and other colors
      avg = (rgba.r + rgba.g + rgba.b) / 3;
      amt = ((Math.abs(max - avg) * 2 / 255) * adjust) / 100;
      
      // Go through each channel, and if it isn't the max, adjust it by the weighted given amount.
      if (rgba.r !== max) {
        diff = max - rgba.r;
        rgba.r += diff * amt;
      }
      
      if (rgba.g !== max) {
        diff = max - rgba.g;
        rgba.g += diff * amt;
      }
      
      if (rgba.b !== max) {
        diff = max - rgba.b;
        rgba.b += diff * amt;
      }
      
      return rgba;
    });
  };
  
  // ## Greyscale
  // An improved greyscale function that should make prettier results
  // than simply using the saturation filter to remove color. It does so by using factors
  // that directly relate to how the human eye perceves color and values. There are
  // no arguments, it simply makes the image greyscale with no in-between.
  //
  // Algorithm adopted from http://www.phpied.com/image-fun/
  Caman.manip.greyscale = function () {
    return this.process({}, function greyscale(adjust, rgba) {
      // Calculate the average value of the 3 color channels using the special factors
      var avg = 0.3 * rgba.r + 0.59 * rgba.g + 0.11 * rgba.b;
      
      // Set all color channels to the same average value
      rgba.r = avg;
      rgba.g = avg;
      rgba.b = avg;
      
      return rgba;
    });
  };
  
  // ## Contrast
  // Increases or decreases the color contrast of the image.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will decrease contrast while values > 0 will increase contrast.
  // The contrast adjustment values are a bit sensitive. While unrestricted, sane adjustment values are
  // usually around 5-10.
  Caman.manip.contrast = function(adjust) {
    adjust = (adjust + 100) / 100;
    adjust = Math.pow(adjust, 2);

    return this.process( adjust, function contrast(adjust, rgba) {
      // Red channel
      rgba.r /= 255;
      rgba.r -= 0.5;
      rgba.r *= adjust;
      rgba.r += 0.5;
      rgba.r *= 255;
      
      // Green channel
      rgba.g /= 255;
      rgba.g -= 0.5;
      rgba.g *= adjust;
      rgba.g += 0.5;
      rgba.g *= 255;
      
      // Blue channel
      rgba.b /= 255;
      rgba.b -= 0.5;
      rgba.b *= adjust;
      rgba.b += 0.5;
      rgba.b *= 255;
      
      // While uglier, I found that using if statements are
      // faster than calling Math.max() and Math.min() to bound
      // the numbers.
      if (rgba.r > 255) {
        rgba.r = 255;
      } else if (rgba.r < 0) {
        rgba.r = 0;
      }
      
      if (rgba.g > 255) {
        rgba.g = 255;
      } else if (rgba.g < 0) {
        rgba.g = 0;
      }
      
      if (rgba.b > 255) {
        rgba.b = 255;
      } else if (rgba.b < 0) {
        rgba.b = 0;
      }
              
      return rgba;
    });
  };
  
  // ## Hue
  // Adjusts the hue of the image. It can be used to shift the colors in an image in a uniform fashion.
  // If you are unfamiliar with Hue, I recommend reading this [Wikipedia article](http://en.wikipedia.org/wiki/Hue).
  //
  // ### Arguments
  // Range is 0 to 100
  // Sometimes, Hue is expressed in the range of 0 to 360. If that's the terminology you're used to, think of 0 to 100
  // representing the percentage of Hue shift in the 0 to 360 range.
  Caman.manip.hue = function(adjust) {
    var hsv, h;

    return this.process( adjust, function hue(adjust, rgba) {
      var rgb;
      
      // Convert current pixel to HSV color space
      hsv = Caman.rgb_to_hsv(rgba.r, rgba.g, rgba.b);
      
      // Convert the hue percentage to a non-fractional number out of 100
      h = hsv.h * 100;
      
      // Shift the hue value by the given amount
      h += Math.abs(adjust);
      
      // Wrap the shift around if it goes over 100.
      h = h % 100;
      
      // Convert the hue back into a percentage
      h /= 100;
      
      // Apply the updated hue value
      hsv.h = h;
      
      // Convert back to RGB color space
      rgb = Caman.hsv_to_rgb(hsv.h, hsv.s, hsv.v);
      
      return {r: rgb.r, g: rgb.g, b: rgb.b};
    });
  };
  
  // ## Colorize
  // Uniformly shifts the colors in an image towards the given color. The adjustment range is from 0 to 100. 
  // The higher the value, the closer the colors in the image shift towards the given adjustment color.
  //
  // ### Arguments
  // This filter is polymorphic and can take two different sets of arguments. Either a hex color string and an adjustment
  // value, or RGB colors and an adjustment value.
  Caman.manip.colorize = function() {
    var diff, rgb, level;
            
    if (arguments.length === 2) {
      // If only 2 arguments, assume we were given a hex color string
      rgb = Caman.hex_to_rgb(arguments[0]);
      level = arguments[1];
    } else if (arguments.length === 4) {
      // Otherwise assume we have RGB colors
      rgb = {
        r: arguments[0],
        g: arguments[1],
        b: arguments[2]        
      };
      
      level = arguments[3];
    }
    
    return this.process( [ level, rgb ],  function colorize( adjust, rgba) {
        // adjust[0] == level; adjust[1] == rgb;
        rgba.r -= (rgba.r - adjust[1].r) * (adjust[0] / 100);
        rgba.g -= (rgba.g - adjust[1].g) * (adjust[0] / 100);
        rgba.b -= (rgba.b - adjust[1].b) * (adjust[0] / 100);
        
        return rgba;
    });
  };
  
  // ## Invert
  // Inverts all colors in the image by subtracting each color channel value from 255. No arguments.
  Caman.manip.invert = function () {
    return this.process({}, function invert (adjust, rgba) {
      rgba.r = 255 - rgba.r;
      rgba.g = 255 - rgba.g;
      rgba.b = 255 - rgba.b;
      
      return rgba;
    });
  };
  
  // ## Sepia
  // Applies an adjustable sepia filter to the image.
  //
  // ### Arguments
  // Assumes adjustment is between 0 and 100, which represents how much the sepia filter is applied.
  Caman.manip.sepia = function (adjust) {
    // If no adjustment value was given, assume 100% sepia
    if (adjust === undefined) {
      adjust = 100;
    }
    
    // Convert to percentage
    adjust = (adjust / 100);
    
    // All three color channels have special conversion factors that define what sepia is. Here we adjust each
    // channel individually, with the twist that you can partially apply the sepia filter.
    return this.process(adjust, function sepia (adjust, rgba) {
      rgba.r = Math.min(255, (rgba.r * (1 - (0.607 * adjust))) + (rgba.g * (0.769 * adjust)) + (rgba.b * (0.189 * adjust)));
      rgba.g = Math.min(255, (rgba.r * (0.349 * adjust)) + (rgba.g * (1 - (0.314 * adjust))) + (rgba.b * (0.168 * adjust)));
      rgba.b = Math.min(255, (rgba.r * (0.272 * adjust)) + (rgba.g * (0.534 * adjust)) + (rgba.b * (1- (0.869 * adjust))));
      
      return rgba;
    });
  };
  
  // ## Gamma
  // Adjusts the gamma of the image.
  //
  // ### Arguments
  // Range is from 0 to infinity, although sane values are from 0 to 4 or 5.
  // Values between 0 and 1 will lessen the contrast while values greater than 1 will increase it.
  Caman.manip.gamma = function (adjust) {
    return this.process(adjust, function gamma(adjust, rgba) {
      rgba.r = Math.pow(rgba.r / 255, adjust) * 255;
      rgba.g = Math.pow(rgba.g / 255, adjust) * 255;
      rgba.b = Math.pow(rgba.b / 255, adjust) * 255;
      
      return rgba;
    });
  };
  
  // ## Noise
  // Adds noise to the image on a scale from 1 - 100. However, the scale isn't constrained, so you can specify
  // a value > 100 if you want a LOT of noise.
  Caman.manip.noise = function (adjust) {
    // Convert the percentage into a 0 - 255 range.
    adjust = Math.abs(adjust) * 2.55;
    return this.process(adjust, function noise(adjust, rgba) {
      // Retrieve a random number between -adjust and adjust
      var rand = Caman.randomRange(adjust*-1, adjust);
      
      // Apply the random value to each color channel to adjust the brightness. This will be clamped automatically
      // by Caman later on if it goes below 0 or over 255.
      rgba.r += rand;
      rgba.g += rand;
      rgba.b += rand;
      
      return rgba;
    });
  };
  
  // ## Clip
  // Clips a color to max values when it falls outside of the specified range.
  //
  // ### Arguments
  // Supplied value should be between 0 and 100.
  Caman.manip.clip = function (adjust) {
    // Convert the percentage into a 0 - 255 range.
    adjust = Math.abs(adjust) * 2.55;
    
    // Go through each color channel, and clip the color if it falls outside of the
    // specified range.
    return this.process(adjust, function clip(adjust, rgba) {
      if (rgba.r > 255 - adjust) {
        rgba.r = 255;
      } else if (rgba.r < adjust) {
        rgba.r = 0;
      }
      
      if (rgba.g > 255 - adjust) {
        rgba.g = 255;
      } else if (rgba.g < adjust) {
        rgba.g = 0;
      }
      
      if (rgba.b > 255 - adjust) {
        rgba.b = 255;
      } else if (rgba.b < adjust) {
        rgba.b = 0;
      }
      
      return rgba;
    });
  };
  
  // ## Channels
  // Lets you modify the intensity of any combination of red, green, or blue channels individually.
  //
  // ### Arguments
  // Must be given at least one color channel to adjust in order to work.
  // Options format (must specify 1 - 3 colors):
  // <pre>{
  //   red: 20,
  //   green: -5,
  //   blue: -40
  // }</pre>
  Caman.manip.channels = function (options) {
    if (typeof(options) !== 'object') {
      return;
    }
    
    // Clean up the arguments object a bit
    for (var chan in options) {
      if (options.hasOwnProperty(chan)) {
        if (options[chan] === 0) {
          delete options[chan];
          continue;
        }
        
        // Convert to a percentage
        options[chan] = options[chan] / 100;
      }
    }
    
    // If there are no color channels, simply return
    if (options.length === 0) {
      return this;
    }
    
    // Go through each color channel and adjust it towards the given color.
    return this.process(options, function channels(options, rgba) {
      if (options.red) {
        if (options.red > 0) {
          // fraction of the distance between current color and 255
          rgba.r = rgba.r + ((255 - rgba.r) * options.red);
        } else {
          // adjust away from the given color
          rgba.r = rgba.r - (rgba.r * Math.abs(options.red));
        }
      }
      
      if (options.green) {
        if (options.green > 0) {
          rgba.g = rgba.g + ((255 - rgba.g) * options.green);
        } else {
          rgba.g = rgba.g - (rgba.g * Math.abs(options.green));
        }
      }
      
      if (options.blue) {
        if (options.blue > 0) {
          rgba.b = rgba.b + ((255 - rgba.b) * options.blue);
        } else {
          rgba.b = rgba.b - (rgba.b * Math.abs(options.blue));
        }
      }
      
      return rgba;
    });
  };
  
  // ## Curves
  // Curves implementation using Bezier curve equation. If you're familiar with the Curves functionality in Photoshop, 
  // this works in a very similar fashion.
  //
  // ### Arguments.
  // <pre>
  //   chan - [r, g, b, rgb]
  //   start - [x, y] (start of curve; 0 - 255)
  //   ctrl1 - [x, y] (control point 1; 0 - 255)
  //   ctrl2 - [x, y] (control point 2; 0 - 255)
  //   end   - [x, y] (end of curve; 0 - 255)
  // </pre>
  //
  // The first argument represents the channels you wish to modify with the filter. It can be an array of channels or a 
  // string (for a single channel). The rest of the arguments are 2-element arrays that represent point coordinates.
  // They are specified in the same order as shown in this image to the right. The coordinates are in the range of\
  // 0 to 255 for both X and Y values.
  //
  // The x-axis represents the input value for a single channel, while the y-axis represents the output value.
  Caman.manip.curves = function (chan, start, ctrl1, ctrl2, end) {
    var bezier, i;
    
    // If the channel(s) given are in the form of a string, split them into
    // an array.
    if (typeof chan === 'string') {
      chan = chan.split("");
    }
    
    // Generate a bezier curve with the given arguments, clamped between 0 and 255
    bezier = Caman.bezier(start, ctrl1, ctrl2, end, 0, 255);
    
    // If our curve starts after x = 0, initialize it with a flat line until
    // the curve begins.
    if (start[0] > 0) {
      for (i = 0; i < start[0]; i++) {
        bezier[i] = start[1];
      }
    }
    
    // ... and the same with the end point
    if (end[0] < 255) {
      for (i = end[0]; i <= 255; i++) {
        bezier[i] = end[1];
      }
    }
    
    // Once we have the complete bezier curve, it's a simple matter of using the array index
    // as the input value to get the output color value.
    return this.process({bezier: bezier, chans: chan}, function curves(opts, rgba) {
      for (var i = 0; i < opts.chans.length; i++) {
        rgba[opts.chans[i]] = opts.bezier[rgba[opts.chans[i]]];
      }
      
      return rgba;
    });
  };
  
  // ## Exposure
  // Adjusts the exposure of the image by using the curves function.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will decrease exposure while values > 0 will increase exposure.
  Caman.manip.exposure = function (adjust) {
    var p, ctrl1, ctrl2;
    
    // Convert to percentage
    p = Math.abs(adjust) / 100;

    // Generate our control points
    ctrl1 = [0, (255 * p)];
    ctrl2 = [(255 - (255 * p)), 255];
    
    if (adjust < 0) {
      ctrl1 = ctrl1.reverse();
      ctrl2 = ctrl2.reverse();
    }
    
    // Simply call the curves filter with our generated arguments
    return this.curves('rgb', [0, 0], ctrl1, ctrl2, [255, 255]);
  };

}(Caman));
/*global Caman: true, exports: true */

/*
 * NodeJS compatibility
 */
if (!Caman && typeof exports == "object") {
	var Caman = {manip:{}};
	exports.plugins = Caman.manip;
}

(function (Caman) {

Caman.manip.boxBlur = function () {
  return this.processKernel('Box Blur', [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
  ]);
};

Caman.manip.radialBlur = function () {
  return this.processKernel('Radial Blur', [
    0, 1, 0,
    1, 1, 1,
    0, 1, 0
  ], 5);
};

Caman.manip.heavyRadialBlur = function () {
  return this.processKernel('Heavy Radial Blur', [
    0, 0, 1, 0, 0,
    0, 1, 1, 1, 0,
    1, 1, 1, 1, 1,
    0, 1, 1, 1, 0,
    0, 0, 1, 0, 0
  ], 13);
};

Caman.manip.gaussianBlur = function () {
  return this.processKernel('Gaussian Blur', [
    1, 4, 6, 4, 1,
    4, 16, 24, 16, 4,
    6, 24, 36, 24, 6,
    4, 16, 24, 16, 4,
    1, 4, 6, 4, 1
  ], 256);
};

Caman.manip.motionBlur = function (degrees) {
  var kernel;
  
  if (degrees === 0 || degrees == 180) {
    kernel = [
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0
    ];
  } else if ((degrees > 0 && degrees < 90) || (degrees > 180 && degrees < 270)) {
    kernel = [
      0, 0, 0, 0, 1,
      0, 0, 0, 1, 0,
      0, 0, 1, 0, 0,
      0, 1, 0, 0, 0,
      1, 0, 0, 0, 0
    ];
  } else if (degrees == 90 || degrees == 270) {
    kernel = [
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      1, 1, 1, 1, 1,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ];
  } else {
    kernel = [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
      0, 0, 0, 0, 1
    ];
  }
  
  return this.processKernel('Motion Blur', kernel, 5);
};

Caman.manip.sharpen = function (amt) {
  if (!amt) {
    amt = 1;
  } else {
    amt /= 100;
  }
  
  return this.processKernel('Sharpen', [
    0, -amt, 0,
    -amt, 4 * amt + 1, -amt,
    0, -amt, 0
  ]);
};

}(Caman));
/*global Caman: true, exports: true */

/*
 * NodeJS compatibility
 */
if (!Caman && typeof exports == "object") {
	var Caman = {manip:{}};
	exports.plugins = Caman.manip;
}

(function (Caman) {

  var vignetteFilters = {
    brightness: function (rgba, amt, opts) {
      rgba.r = rgba.r - (rgba.r * amt * opts.strength);
      rgba.g = rgba.g - (rgba.g * amt * opts.strength);
      rgba.b = rgba.b - (rgba.b * amt * opts.strength);
      
      return rgba;
    },
    
    gamma: function (rgba, amt, opts) {
      rgba.r = Math.pow(rgba.r / 255, Math.max(10 * amt * opts.strength, 1)) * 255;
      rgba.g = Math.pow(rgba.g / 255, Math.max(10 * amt * opts.strength, 1)) * 255;
      rgba.b = Math.pow(rgba.b / 255, Math.max(10 * amt * opts.strength, 1)) * 255;
      
      return rgba;
    },
    
    colorize: function (rgba, amt, opts) {
      rgba.r -= (rgba.r - opts.color.r) * amt;
      rgba.g -= (rgba.g - opts.color.g) * amt;
      rgba.b -= (rgba.b - opts.color.b) * amt;
      
      return rgba;
    }
  };
  
  /*
   * Legacy vignette function. Creates a circular vignette and uses
   * gamma adjustments to darken.
   *
   * If size is a string and ends with %, its a percentage. Otherwise,
   * its an absolute number of pixels.
   */
  Caman.manip.vignette = function (size, strength) {
    var center, start, end, loc, dist, div, bezier;

    if (typeof size === "string" && size.substr(-1) == "%") {
      if (this.dimensions.height > this.dimensions.width) {
        size = this.dimensions.width * (Number(size.substr(0, size.length - 1)) / 100);
      } else {
        size = this.dimensions.height * (Number(size.substr(0, size.length - 1)) / 100);
      }
    }
    
    if (!strength) {
      strength = 0.6;
    } else {
      strength /= 100;
    }
    
    center = [(this.dimensions.width / 2), (this.dimensions.height / 2)];
    
    // start = darkest part
    start = Math.sqrt(Math.pow(center[0], 2) + Math.pow(center[1], 2)); // corner to center dist
    
    // end = lightest part (0 vignette)
    end = start - size;
    
    bezier = Caman.bezier([0, 1], [30, 30], [70, 60], [100, 80]);
    return this.process({center: center, start: start, end: end, size: size, strength: strength, bezier: bezier}, function vignette(data, rgba) {
      // current pixel coordinates
      loc = this.locationXY();
      
      // distance between center of image and current pixel
      dist = Math.sqrt(Math.pow(loc.x - data.center[0], 2) + Math.pow(loc.y - data.center[1], 2));
      
      if (dist > data.end) {
        // % of vignette
        div = Math.max(1, ((data.bezier[Math.round(((dist - data.end) / data.size) * 100)]/10) * strength));
        
        // Use gamma to adjust the vignette - much better results
        rgba.r = Math.pow(rgba.r / 255, div) * 255;
	      rgba.g = Math.pow(rgba.g / 255, div) * 255;
	      rgba.b = Math.pow(rgba.b / 255, div) * 255;
      }
      
      return rgba;
    });
  };
  
  /*
   * Creates a rectangular vignette with rounded corners of a given radius.
   *
   * Options:
   *    size: width and height of the rectangular region; e.g. {width: 300, height: 400}
   *    strength: how strong should the vignette effect be?; default = 50
   *    cornerRadius: radius of the rounded corners; default = 0
   *    method: brightness, gamma, colorize, blur (not implemented); default = brightness
   *    color: only used if method is colorize; default = #000000
   */
  Caman.manip.rectangularVignette = function (opts) {
    var defaults = {
      strength: 50,
      cornerRadius: 0,
      method: 'brightness',
      color: {r: 0, g: 0, b: 0}
    };
    
    opts = Caman.extend(defaults, opts);
    
    if (!opts.size) {
      return this;
    } else if (typeof opts.size === "string") {
      // Percentage
      var percent = parseInt(opts.size, 10) / 100;
      opts.size = {
        width: this.dimensions.width * percent,
        height: this.dimensions.height * percent
      };
    } else if (typeof opts.size === "object") {
      if (typeof opts.size.width === "string") {
        opts.size.width = this.dimensions.width * (parseInt(opts.size.width, 10) / 100);
      }
      
      if (typeof opts.size.height === "string") {
        opts.size.height = this.dimensions.height * (parseInt(opts.size.height, 10) / 100);
      }
    } else if (typeof opts.size === "number") {
      var size = opts.size;
      opts.size = {
        width: size,
        height: size
      };
    }
    
    if (typeof opts.cornerRadius === "string") {
      // Variable corner radius
      opts.cornerRadius = (opts.size.width / 2) * (parseInt(opts.cornerRadius, 10) / 100);
    }
    
    opts.strength /= 100;
    
    // Since pixels are discreet, force size to be an int
    opts.size.width = Math.floor(opts.size.width);
    opts.size.height = Math.floor(opts.size.height);
    opts.image = {
      width: this.dimensions.width,
      height: this.dimensions.height
    };
    
    if (opts.method == "colorize" && typeof opts.color === "string") {
      opts.color = Caman.hex_to_rgb(opts.color);
    }
    
    // Generate useful rectangle dimensions
    opts.coords = {};
    opts.coords.left = (this.dimensions.width - opts.size.width) / 2;
    opts.coords.right = this.dimensions.width - opts.coords.left;
    opts.coords.bottom = (this.dimensions.height - opts.size.height) / 2;
    opts.coords.top = this.dimensions.height - opts.coords.bottom;
    
    // Important rounded corner info
    // Order is top left corner moving clockwise around rectangle
    opts.corners = [
      {x: opts.coords.left + opts.cornerRadius, y: opts.coords.top - opts.cornerRadius},
      {x: opts.coords.right - opts.cornerRadius, y: opts.coords.top - opts.cornerRadius},
      {x: opts.coords.right - opts.cornerRadius, y: opts.coords.bottom + opts.cornerRadius},
      {x: opts.coords.left + opts.cornerRadius, y: opts.coords.bottom + opts.cornerRadius}
    ];
    
    opts.maxDist = Caman.distance(0, 0, opts.corners[3].x, opts.corners[3].y) - opts.cornerRadius;

    var loc, amt, radialDist;
    return this.process(opts, function rectangularVignette (opts, rgba) {
      loc = this.locationXY();

      // Trivial rejects
      if ((loc.x > opts.corners[0].x && loc.x < opts.corners[1].x) && (loc.y > opts.coords.bottom && loc.y < opts.coords.top)) {
        return rgba;
      } else if ((loc.x > opts.coords.left && loc.x < opts.coords.right) && (loc.y > opts.corners[3].y && loc.y < opts.corners[2].y)) {
        return rgba;
      }
      
      // Need to figure out which section we're in. First, the trivial ones:
      if (loc.x > opts.corners[0].x && loc.x < opts.corners[1].x && loc.y > opts.coords.top) {
        // top-middle section
        amt = (loc.y - opts.coords.top) / opts.maxDist;
      } else if (loc.y > opts.corners[2].y && loc.y < opts.corners[1].y && loc.x > opts.coords.right) {
        // right-middle section
        amt = (loc.x - opts.coords.right) / opts.maxDist;
      } else if (loc.x > opts.corners[0].x && loc.x < opts.corners[1].x && loc.y < opts.coords.bottom) {
        // bottom-middle section
        amt = (opts.coords.bottom - loc.y) / opts.maxDist;
      } else if (loc.y > opts.corners[2].y && loc.y < opts.corners[1].y && loc.x < opts.coords.left) {
        // left-middle section
        amt = (opts.coords.left - loc.x) / opts.maxDist;
      } else if (loc.x <= opts.corners[0].x && loc.y >= opts.corners[0].y) {
        // top-left corner
        radialDist = Caman.distance(loc.x, loc.y, opts.corners[0].x, opts.corners[0].y);
        amt = (radialDist - opts.cornerRadius) / opts.maxDist;
      } else if (loc.x >= opts.corners[1].x && loc.y >= opts.corners[1].y) {
        // top-right corner
        radialDist = Caman.distance(loc.x, loc.y, opts.corners[1].x, opts.corners[1].y);
        amt = (radialDist - opts.cornerRadius) / opts.maxDist;
      } else if (loc.x >= opts.corners[2].x && loc.y <= opts.corners[2].y) {
        // bottom-right corner
        radialDist = Caman.distance(loc.x, loc.y, opts.corners[2].x, opts.corners[2].y);
        amt = (radialDist - opts.cornerRadius) / opts.maxDist;
      } else if (loc.x <= opts.corners[3].x && loc.y <= opts.corners[3].y) {
        // bottom-left corner
        radialDist = Caman.distance(loc.x, loc.y, opts.corners[3].x, opts.corners[3].y);
        amt = (radialDist - opts.cornerRadius) / opts.maxDist;
      }
      
      if (amt < 0) {
        // Inside of rounded corner
        return rgba;
      }
      
      return vignetteFilters[opts.method](rgba, amt, opts);
    });
  };

}(Caman));
/*

CompoundBlur - Blurring with varying radii for Canvas

Version:   0.1
Author:  Mario Klingemann
Contact:   mario@quasimondo.com
Website:  http://www.quasimondo.com/StackBlurForCanvas
Twitter:  @quasimondo
Modified By: Ryan LeFevre (@meltingice)

In case you find this class useful - especially in commercial projects -
I am not totally unhappy for a small donation to my PayPal account
mario@quasimondo.de

Copyright (c) 2011 Mario Klingemann

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

/*global Caman: true, exports: true */
if (!Caman && typeof exports == "object") {
  var Caman = {manip:{}};
  exports.plugins = Caman.manip;
}

(function(Caman) {

  var mul_table = [
  512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];


  var shg_table = [
  9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];


  function getLinearGradientMap(width, height, centerX, centerY, angle, length, mirrored) {
    var cnv = document.createElement('canvas');
    cnv.width = width;
    cnv.height = height;

    var x1 = centerX + Math.cos(angle) * length * 0.5;
    var y1 = centerY + Math.sin(angle) * length * 0.5;

    var x2 = centerX - Math.cos(angle) * length * 0.5;
    var y2 = centerY - Math.sin(angle) * length * 0.5;

    var context = cnv.getContext("2d");
    var gradient = context.createLinearGradient(x1, y1, x2, y2);
    if (!mirrored) {
      gradient.addColorStop(0, "white");
      gradient.addColorStop(1, "black");
    } else {
      gradient.addColorStop(0, "white");
      gradient.addColorStop(0.5, "black");
      gradient.addColorStop(1, "white");
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  }

  function getRadialGradientMap(width, height, centerX, centerY, radius1, radius2) {
    var cnv = document.createElement('canvas');
    cnv.width = width;
    cnv.height = height;


    var context = cnv.getContext("2d");
    var gradient = context.createRadialGradient(centerX, centerY, radius1, centerX, centerY, radius2);

    gradient.addColorStop(1, "white");
    gradient.addColorStop(0, "black");

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  }
  
  function BlurStack() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.next = null;
  }

  Caman.plugin.compoundBlur = function (radiusData, radius, increaseFactor, blurLevels) {
    var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, 
    r_out_sum, g_out_sum, b_out_sum, r_in_sum, g_in_sum, 
    b_in_sum, pr, pg, pb, rbs;

    var width = this.dimensions.width;
    var height = this.dimensions.height;

    var imagePixels = this.pixel_data;
    var radiusPixels = radiusData.data;

    var wh = width * height;
    var wh4 = wh << 2;
    var pixels = [];

    for (i = 0; i < wh4; i++) {
      pixels[i] = imagePixels[i];
    }

    var currentIndex = 0;
    var steps = blurLevels;
    blurLevels -= 1;

    while (steps-- >= 0) {
      var iradius = (radius + 0.5) | 0;
      if (iradius === 0) continue;
      if (iradius > 256) iradius = 256;

      var div = iradius + iradius + 1;
      var w4 = width << 2;
      var widthMinus1 = width - 1;
      var heightMinus1 = height - 1;
      var radiusPlus1 = iradius + 1;
      var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

      var stackStart = new BlurStack();
      var stackEnd;
      var stack = stackStart;
      for (i = 1; i < div; i++) {
        stack = stack.next = new BlurStack();
        if (i == radiusPlus1) stackEnd = stack;
      }
      stack.next = stackStart;
      var stackIn = null;
      var stackOut = null;

      yw = yi = 0;

      var mul_sum = mul_table[iradius];
      var shg_sum = shg_table[iradius];

      for (y = 0; y < height; y++) {
        r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;

        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++) {
          stack.r = pr;
          stack.g = pg;
          stack.b = pb;
          stack = stack.next;
        }

        for (i = 1; i < radiusPlus1; i++) {
          p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
          r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
          g_sum += (stack.g = (pg = pixels[p + 1])) * rbs;
          b_sum += (stack.b = (pb = pixels[p + 2])) * rbs;

          r_in_sum += pr;
          g_in_sum += pg;
          b_in_sum += pb;

          stack = stack.next;
        }


        stackIn = stackStart;
        stackOut = stackEnd;
        for (x = 0; x < width; x++) {
          pixels[yi] = (r_sum * mul_sum) >> shg_sum;
          pixels[yi + 1] = (g_sum * mul_sum) >> shg_sum;
          pixels[yi + 2] = (b_sum * mul_sum) >> shg_sum;

          r_sum -= r_out_sum;
          g_sum -= g_out_sum;
          b_sum -= b_out_sum;

          r_out_sum -= stackIn.r;
          g_out_sum -= stackIn.g;
          b_out_sum -= stackIn.b;

          p = (yw + ((p = x + radiusPlus1) < widthMinus1 ? p : widthMinus1)) << 2;

          r_in_sum += (stackIn.r = pixels[p]);
          g_in_sum += (stackIn.g = pixels[p + 1]);
          b_in_sum += (stackIn.b = pixels[p + 2]);

          r_sum += r_in_sum;
          g_sum += g_in_sum;
          b_sum += b_in_sum;

          stackIn = stackIn.next;

          r_out_sum += (pr = stackOut.r);
          g_out_sum += (pg = stackOut.g);
          b_out_sum += (pb = stackOut.b);

          r_in_sum -= pr;
          g_in_sum -= pg;
          b_in_sum -= pb;

          stackOut = stackOut.next;

          yi += 4;
        }
        yw += width;
      }


      for (x = 0; x < width; x++) {
        g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

        yi = x << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++) {
          stack.r = pr;
          stack.g = pg;
          stack.b = pb;
          stack = stack.next;
        }

        yp = width;

        for (i = 1; i < radiusPlus1; i++) {
          yi = (yp + x) << 2;

          r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
          g_sum += (stack.g = (pg = pixels[yi + 1])) * rbs;
          b_sum += (stack.b = (pb = pixels[yi + 2])) * rbs;

          r_in_sum += pr;
          g_in_sum += pg;
          b_in_sum += pb;

          stack = stack.next;

          if (i < heightMinus1) {
            yp += width;
          }
        }

        yi = x;
        stackIn = stackStart;
        stackOut = stackEnd;
        for (y = 0; y < height; y++) {
          p = yi << 2;
          pixels[p] = (r_sum * mul_sum) >> shg_sum;
          pixels[p + 1] = (g_sum * mul_sum) >> shg_sum;
          pixels[p + 2] = (b_sum * mul_sum) >> shg_sum;

          r_sum -= r_out_sum;
          g_sum -= g_out_sum;
          b_sum -= b_out_sum;

          r_out_sum -= stackIn.r;
          g_out_sum -= stackIn.g;
          b_out_sum -= stackIn.b;

          p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

          r_sum += (r_in_sum += (stackIn.r = pixels[p]));
          g_sum += (g_in_sum += (stackIn.g = pixels[p + 1]));
          b_sum += (b_in_sum += (stackIn.b = pixels[p + 2]));

          stackIn = stackIn.next;

          r_out_sum += (pr = stackOut.r);
          g_out_sum += (pg = stackOut.g);
          b_out_sum += (pb = stackOut.b);

          r_in_sum -= pr;
          g_in_sum -= pg;
          b_in_sum -= pb;

          stackOut = stackOut.next;

          yi += width;
        }
      }

      radius *= increaseFactor;

      for (i = wh; --i > -1;) {
        var idx = i << 2;
        var lookupValue = (radiusPixels[idx + 2] & 0xff) / 255.0 * blurLevels;
        var index = lookupValue | 0;

        if (index == currentIndex) {
          var blend = 256.0 * (lookupValue - (lookupValue | 0));
          var iblend = 256 - blend;

          imagePixels[idx] = (imagePixels[idx] * iblend + pixels[idx] * blend) >> 8;
          imagePixels[idx + 1] = (imagePixels[idx + 1] * iblend + pixels[idx + 1] * blend) >> 8;
          imagePixels[idx + 2] = (imagePixels[idx + 2] * iblend + pixels[idx + 2] * blend) >> 8;

        } else if (index == currentIndex + 1) {
          imagePixels[idx] = pixels[idx];
          imagePixels[idx + 1] = pixels[idx + 1];
          imagePixels[idx + 2] = pixels[idx + 2];

        }
      }
      currentIndex++;
    }
    
    return this;
  };

  /*
   * Tilt-Shift effect
   */
  Caman.manip.tiltShift = function (opts) {
    var self = this;

    var defaults = {
      center: {x: self.dimensions.width / 2, y: self.dimensions.height / 2},
      angle: 45,
      focusWidth: 200,
      startRadius: 3,
      radiusFactor: 1.5,
      steps: 3
    };
    
    opts = Caman.extend(defaults, opts);

    opts.angle *= Math.PI / 180;
    var gradient = getLinearGradientMap(this.dimensions.width, this.dimensions.height, opts.center.x, opts.center.y, opts.angle, opts.focusWidth, true);
    return this.processPlugin("compoundBlur", [gradient, opts.startRadius, opts.radiusFactor, opts.steps]);
  };
  
  Caman.manip.vignetteBlur = function (opts) {
    var self = this;
    var defaults = {
      size: 50,
      center: {x: self.dimensions.width / 2, y: self.dimensions.height / 2},
      startRadius: 3,
      radiusFactor: 1.5,
      steps: 3
    };
    
    opts = Caman.extend(defaults, opts);
    
    var max = (this.dimensions.width < this.dimensions.height) ? this.dimensions.height : this.dimensions.width;
    var radius1 = (max / 2) - opts.size;
    var radius2 = (max / 2);
    
    console.log(radius1, radius2);
    var gradient = getRadialGradientMap(this.dimensions.width, this.dimensions.height, opts.center.x, opts.center.y, radius1, radius2);
    return this.processPlugin("compoundBlur", [gradient, opts.startRadius, opts.radiusFactor, opts.steps]);
  };

}(Caman));

/*global Caman: true, exports: true */

/*
 * NodeJS compatibility
 */
if (!Caman && typeof exports == "object") {
	var Caman = {manip:{}};
	exports.plugins = Caman.manip;
}

(function (Caman) {

Caman.manip.edgeEnhance = function () {
  return this.processKernel('Edge Enhance', [
    [0, 0, 0],
    [-1, 1, 0],
    [0, 0, 0]
  ]);
};

Caman.manip.edgeDetect = function () {
  return this.processKernel('Edge Detect', [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1]
  ]);
};

Caman.manip.emboss = function () {
  return this.processKernel('Emboss', [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2]
  ]);
};

}(Caman));
if (!Caman && typeof exports == "object") {
  var Caman = {manip:{}};
  exports.plugins = Caman.manip;
}

(function (Caman) {

//adjust must be [2...255]
// works best with smaller input values
Caman.manip.posterize = function (adjust) {
  var numOfAreas = 256 / adjust;
  var numOfValues = 255 / (adjust - 1);
  
  return this.process( [numOfAreas, numOfValues], function posterize (adjust, rgba) {
    rgba.r = Math.floor(Math.floor( rgba.r / adjust[0] ) * adjust[1]);
    rgba.g = Math.floor(Math.floor( rgba.g / adjust[0] ) * adjust[1]);
    rgba.b = Math.floor(Math.floor( rgba.b / adjust[0] ) * adjust[1]);

    return rgba;
  });
};

}(Caman));
/*global Caman: true, exports: true */

/*
 * NodeJS compatibility
 */
if (!Caman && typeof exports == "object") {
  var Caman = {manip:{}};
  exports.plugins = Caman.manip;
}

(function (Caman) {

Caman.manip.vintage = function (vignette) {
  this
    .greyscale()
    .contrast(5)
    .noise(3)
    .sepia(100)
    .channels({red: 8, blue: 2, green: 4})
    .gamma(0.87);
    
	if (vignette || typeof vignette === 'undefined') {
    this.vignette("40%", 30);
  }
  
  return this;
};

Caman.manip.lomo = function() {
  return this
    .brightness(15)
    .exposure(15)
    .curves('rgb', [0, 0], [200, 0], [155, 255], [255, 255])
    .saturation(-20)
    .gamma(1.8)
    .vignette("50%", 60)
    .brightness(5);
};

Caman.manip.clarity = function (grey) {
  var manip = this
    .vibrance(20)
    .curves('rgb', [5, 0], [130, 150], [190, 220], [250, 255])
    .sharpen(15)
    .vignette("45%", 20);
    
   if (grey) {
     this
       .greyscale()
       .contrast(4);
   }
   
   return manip;
};

Caman.manip.sinCity = function () {
  return this
    .contrast(100)
    .brightness(15)
    .exposure(10)
    .curves('rgb', [0,0], [100, 0], [155, 255], [255, 255])
    .clip(30)
    .greyscale();
};

Caman.manip.sunrise = function () {
  return this
    .exposure(3.5)
    .saturation(-5)
    .vibrance(50)
    .sepia(60)
    .colorize('#e87b22', 10)
    .channels({red: 8, blue: 8})
    .contrast(5)
    .gamma(1.2)
    .vignette("55%", 25);
};

Caman.manip.crossProcess = function () {
  return this
    .exposure(5)
    .colorize('#e87b22', 4)
    .sepia(20)
    .channels({blue: 8, red: 3})
    .curves('b', [0, 0], [100, 150], [180, 180], [255, 255])
    .contrast(15)
    .vibrance(75)
    .gamma(1.6);
};

Caman.manip.orangePeel = function () {
  return this
    .curves('rgb', [0, 0], [100, 50], [140, 200], [255, 255])
    .vibrance(-30)
    .saturation(-30)
    .colorize('#ff9000', 30)
    .contrast(-5)
    .gamma(1.4);
};

Caman.manip.love = function () {
  return this
    .brightness(5)
    .exposure(8)
    .colorize('#c42007', 30)
    .vibrance(50)
    .gamma(1.3);
};

Caman.manip.grungy = function () {
  return this
    .gamma(1.5)
    .clip(25)
    .saturation(-60)
    .contrast(5)
    .noise(5)
    .vignette("50%", 30);
};

Caman.manip.jarques = function () {
  return this
    .saturation(-35)
    .curves('b', [20, 0], [90, 120], [186, 144], [255, 230])
    .curves('r', [0, 0], [144, 90], [138, 120], [255, 255])
    .curves('g', [10, 0], [115, 105], [148, 100], [255, 248])
    .curves('rgb', [0, 0], [120, 100], [128, 140], [255, 255])
    .sharpen(20);
};

Caman.manip.pinhole = function () {
  return this
    .greyscale()
    .sepia(10)
    .exposure(10)
    .contrast(15)
    .vignette("60%", 35);
};

Caman.manip.oldBoot = function () {
  return this
    .saturation(-20)
    .vibrance(-50)
    .gamma(1.1)
    .sepia(30)
    .channels({red: -10, blue: 5})
    .curves('rgb', [0, 0], [80, 50], [128, 230], [255, 255])
    .vignette("60%", 30);
};

Caman.manip.glowingSun = function () {
  this.brightness(10);
    
  this.newLayer(function () {
    this.setBlendingMode('multiply');
    this.opacity(80);
    this.copyParent();
    
    this.filter.gamma(0.8);
    this.filter.contrast(50);
    
    this.filter.exposure(10);
  });
  
  this.newLayer(function () {
    this.setBlendingMode('softLight');
    this.opacity(80);
    this.fillColor('#f49600');
  });
  
  this.exposure(20);
  this.gamma(0.8);
  
  return this.vignette("45%", 20);
};

Caman.manip.hazyDays = function () {
  this.gamma(1.2);
    
  this.newLayer(function () {
    this.setBlendingMode('overlay');
    this.opacity(60);
    this.copyParent();
    
    this.filter.channels({red: 5});
    this.filter.stackBlur(15);
  });
  
  this.newLayer(function () {
   this.setBlendingMode('addition');
   this.opacity(40);
   this.fillColor('#6899ba');
  });
  
  this.newLayer(function () {
    this.setBlendingMode('multiply');
    this.opacity(35);
    this.copyParent();
    
    this.filter.brightness(40);
    this.filter.vibrance(40);
    this.filter.exposure(30);
    this.filter.contrast(15);
    
    this.filter.curves('r', [0, 40], [128, 128], [128, 128], [255, 215]);
    this.filter.curves('g', [0, 40], [128, 128], [128, 128], [255, 215]);
    this.filter.curves('b', [0, 40], [128, 128], [128, 128], [255, 215]);
    
    this.filter.stackBlur(5);
  });
  
  this.curves('r', [20, 0], [128, 158], [128, 128], [235, 255]);
  this.curves('g', [20, 0], [128, 128], [128, 128], [235, 255]);
  this.curves('b', [20, 0], [128, 108], [128, 128], [235, 255]);
  
  return this.vignette("45%", 20);
};

Caman.manip.herMajesty = function () {
  this.brightness(40);
  this.colorize('#ea1c5d', 10);
  this.curves('b', [0, 10], [128, 180], [190, 190], [255, 255]);
  
  this.newLayer(function () {
    this.setBlendingMode('overlay');
    this.opacity(50);
    this.copyParent();
    
    this.filter.gamma(0.7);
    this.newLayer(function () {
      this.setBlendingMode('normal');
      this.opacity(60);
      this.fillColor('#ea1c5d');
    });
  });
  
  this.newLayer(function () {
    this.setBlendingMode('multiply');
    this.opacity(60);
    this.copyParent();
    
    this.filter.saturation(50);
    this.filter.hue(90);
    this.filter.contrast(10);
  });
  
  this.gamma(1.4);
  this.vibrance(-30);
  
  this.newLayer(function () {
    this.opacity(10);
    this.fillColor('#e5f0ff');
  });
  
  return this;
};

Caman.manip.nostalgia = function () {
  this
    .saturation(20)
    .gamma(1.4)
    .greyscale()
    .contrast(5)
    .sepia(100)
    .channels({red: 8, blue: 2, green: 4})
    .gamma(0.8)
    .contrast(5)
    .exposure(10);
    
  this.newLayer(function () {
    this.setBlendingMode('overlay');
    this.copyParent();
    this.opacity(55);
    
    this.filter.stackBlur(10);
  });
    
  return this.vignette("50%", 30);
};

Caman.manip.hemingway = function () {
  this.greyscale();
  this.contrast(10);
  this.gamma(0.9);
  
  this.newLayer(function () {
    this.setBlendingMode('multiply');
    this.opacity(40);
    
    this.copyParent();
    this.filter.exposure(15);
    this.filter.contrast(15);
    this.filter.channels({green: 10, red: 5});
  });
  
  this.sepia(30);
  this.curves('rgb', [0, 10], [120, 90], [180, 200], [235, 255]);
  this.channels({red: 5, green: -2});
  this.exposure(15);
  
  return this;
};

Caman.manip.loveBug = function () {
  this.greyscale();
  this.colorize('#005ef7', 10);
  
  this.newLayer(function () {
    this.setBlendingMode('multiply');
    this.opacity(30);
    this.copyParent();
    
    this.filter.gamma(1.6);
  });
  
  this.contrast(10);
  
  this.newLayer(function () {
    this.setBlendingMode('exclusion');
    this.opacity(50);
    this.copyParent();
    
    this.filter.gamma(1.4);    
    this.filter.colorize('#ff00d0', 50);
    this.filter.rectangularVignette({
      size: {
        width: "80%",
        height: "60%"
      },
      strength: 60,
      cornerRadius: "70%",
      method: "brightness"
    });
    this.filter.stackBlur(3);
  });
  
  this.exposure(15);
  this.rectangularVignette({
    size: {
      width: "90%",
      height: "70%"
    },
    strength: 30,
    cornerRadius: "70%",
    method: "colorize",
    color: "#001138"
  });
  
  return this;
};

}(Caman));
/*

StackBlur - a fast almost Gaussian Blur For Canvas v0.31 modified for CamanJS

Version:   0.31
Author:    Mario Klingemann
Contact:   mario@quasimondo.com
Website:  http://www.quasimondo.com/StackBlurForCanvas
Twitter:  @quasimondo
Modified By: Ryan LeFevre (@meltingice)

In case you find this class useful - especially in commercial projects -
I am not totally unhappy for a small donation to my PayPal account
mario@quasimondo.de

Or support me on flattr: 
https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

Copyright (c) 2010 Mario Klingemann

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

/*global Caman: true, exports: true */
if (!Caman && typeof exports == "object") {
  var Caman = {manip:{}};
  exports.plugins = Caman.manip;
}

(function (Caman) {

var mul_table = [
    512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
    454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
    482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
    437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
    497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
    320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
    446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
    329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
    505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
    399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
    324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
    268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
    451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
    385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
    332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
    289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];
        
   
var shg_table = [
       9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 
    17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 
    19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 
    23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

function BlurStack() {
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = 0;
  this.next = null;
}

Caman.plugin.stackBlur = function ( radius ) {
  if ( isNaN(radius) || radius < 1 ) return;
  radius |= 0;
      
  var pixels = this.pixel_data;
  var width = this.dimensions.width;
  var height = this.dimensions.height;
      
  var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
  r_out_sum, g_out_sum, b_out_sum,
  r_in_sum, g_in_sum, b_in_sum,
  pr, pg, pb, rbs;
      
  var div = radius + radius + 1;
  var w4 = width << 2;
  var widthMinus1  = width - 1;
  var heightMinus1 = height - 1;
  var radiusPlus1  = radius + 1;
  var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;
  
  var stackStart = new BlurStack();
  var stack = stackStart,
  stackEnd;
  for ( i = 1; i < div; i++ )
  {
    stack = stack.next = new BlurStack();
    if ( i == radiusPlus1 ) stackEnd = stack;
  }
  stack.next = stackStart;
  var stackIn = null;
  var stackOut = null;
  
  yw = yi = 0;
  
  var mul_sum = mul_table[radius];
  var shg_sum = shg_table[radius];
  
  for ( y = 0; y < height; y++ )
  {
    r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;
    
    r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
    g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
    b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
    
    r_sum += sumFactor * pr;
    g_sum += sumFactor * pg;
    b_sum += sumFactor * pb;
    
    stack = stackStart;
    
    for( i = 0; i < radiusPlus1; i++ )
    {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack = stack.next;
    }
    
    for( i = 1; i < radiusPlus1; i++ )
    {
      p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
      r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
      g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
      b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
      
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
      
      stack = stack.next;
    }
    
    
    stackIn = stackStart;
    stackOut = stackEnd;
    for ( x = 0; x < width; x++ )
    {
      pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
      pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
      pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;
      
      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
      
      r_out_sum -= stackIn.r;
      g_out_sum -= stackIn.g;
      b_out_sum -= stackIn.b;
      
      p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;
      
      r_in_sum += ( stackIn.r = pixels[p]);
      g_in_sum += ( stackIn.g = pixels[p+1]);
      b_in_sum += ( stackIn.b = pixels[p+2]);
      
      r_sum += r_in_sum;
      g_sum += g_in_sum;
      b_sum += b_in_sum;
      
      stackIn = stackIn.next;
      
      r_out_sum += ( pr = stackOut.r );
      g_out_sum += ( pg = stackOut.g );
      b_out_sum += ( pb = stackOut.b );
      
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
      
      stackOut = stackOut.next;

      yi += 4;
    }
    yw += width;
  }

  
  for ( x = 0; x < width; x++ )
  {
    g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;
    
    yi = x << 2;
    r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
    g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
    b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
    
    r_sum += sumFactor * pr;
    g_sum += sumFactor * pg;
    b_sum += sumFactor * pb;
    
    stack = stackStart;
    
    for( i = 0; i < radiusPlus1; i++ )
    {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack = stack.next;
    }
    
    yp = width;
    
    for( i = 1; i <= radius; i++ )
    {
      yi = ( yp + x ) << 2;
      
      r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
      g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
      b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
      
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
      
      stack = stack.next;
    
      if( i < heightMinus1 )
      {
        yp += width;
      }
    }
    
    yi = x;
    stackIn = stackStart;
    stackOut = stackEnd;
    for ( y = 0; y < height; y++ )
    {
      p = yi << 2;
      pixels[p]   = (r_sum * mul_sum) >> shg_sum;
      pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
      pixels[p+2] = (b_sum * mul_sum) >> shg_sum;
      
      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
      
      r_out_sum -= stackIn.r;
      g_out_sum -= stackIn.g;
      b_out_sum -= stackIn.b;
      
      p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;
      
      r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
      g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
      b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
      
      stackIn = stackIn.next;
      
      r_out_sum += ( pr = stackOut.r );
      g_out_sum += ( pg = stackOut.g );
      b_out_sum += ( pb = stackOut.b );
      
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
      
      stackOut = stackOut.next;
      
      yi += width;
    }
  }
  
  return this;
};

Caman.manip.stackBlur = function (radius) {
  return this.processPlugin("stackBlur", [radius]);
};

}(Caman));
/*global Caman: true, exports: true */

/*
 * NodeJS compatibility
 */
if (!Caman && typeof exports == "object") {
  var Caman = {manip:{}};
  exports.plugins = Caman.manip;
}

(function (Caman) {

Caman.manip.threshold = function(adjust) {
  return this.process( adjust, function threshold (adjust, rgba) {
  
    var luminance = (0.2126*rgba.r) + (0.7152*rgba.g) + (0.0722*rgba.b);
    
    if (luminance < adjust) {
      rgba.r = 0;
      rgba.g = 0;
      rgba.b = 0;
    } else {
      rgba.r = 255;
      rgba.g = 255;
      rgba.b = 255;
    }

    return rgba;
  });
};

}(Caman));
