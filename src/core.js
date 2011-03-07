/*!
 * CamanJS - Pure HTML5 Javascript (Ca)nvas (Man)ipulation
 * http://camanjs.com/
 *
 * Copyright 2011, Ryan LeFevre
 * Licensed under the new BSD License.
 * See LICENSE for more info.
 *
 * Project Contributors:
 *   Ryan LeFevre - Lead Developer and Project Maintainer
 *    Twitter: @meltingice
 *    GitHUb: http://github.com/meltingice
 *
 *   Rick Waldron - Plugin Architect and Developer
 *    Twitter: @rwaldron
 *    GitHub: http://github.com/rwldrn
 *
 *   Cezar Sa Espinola - Developer
 *    Twitter: @cezarsa
 *    GitHub: http://github.com/cezarsa
 */
 
/*global Caman: true */
(function () {

var forEach = Array.prototype.forEach,
hasOwn = Object.prototype.hasOwnProperty,
slice = Array.prototype.slice,

// Helper function since document.getElementById()
// is a mouthful. Note that this will not conflict
// with jQuery since this $ variable does not exist
// in the global window scope.
$ = function (id) {
  if (id[0] == '#') {
    id = id.substr(1);
  }
  
  return document.getElementById(id);
},

Caman = function () {
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
        return new Caman.manip.loadImage(arguments[0], arguments[1]);
        
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

if (!('console' in window)) {
  window.console = {
    log: function () {},
    info: function () {},
    error: function () {}
  };
}

Caman.ready = false;
Caman.store = {};
Caman.renderBlocks = 4;

Caman.remoteProxy = "";

/*
 * Here we define the proxies that ship with CamanJS for easy
 * usage.
 */
Caman.useProxy = function (lang) {
  // define cases where file extensions don't match the language name
  var langToExt = {
    ruby: 'rb',
    python: 'py',
    perl: 'pl'
  };
  
  lang = langToExt[lang.toLowerCase()] || lang.toLowerCase();
  
  return "proxies/caman_proxy." + lang;
};

Caman.uniqid = (function () {
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

var remoteCheck = function (src) {
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

var finishInit = function (image, canvas, callback) {
  var self = this;
  
  // Used for saving pixel layers
  this.pixelStack = [];
  this.layerStack = [];
  
  var old_height = image.height, old_width = image.width;
  if (image.style.width || image.style.height) {
    if (image.style.width) {
      image.width = parseInt(image.style.width, 10);
      
      if (image.style.height) {
        image.height = parseInt(image.style.height, 10);
      } else {
        image.height = image.width * old_height / old_width;
      }
    } else if (image.style.height) {
      image.height = parseInt(image.style.height, 10);
      image.width = image.height * old_width / old_height;
    }
  }
  
  canvas.width = image.width;
  canvas.height = image.height;
  
  this.canvas = canvas;
  this.context = canvas.getContext("2d");
  this.context.drawImage(image, 0, 0, image.width, image.height);
  
  this.image_data = this.context.getImageData(0, 0, image.width, image.height);
  this.pixel_data = this.image_data.data;
  
  this.dimensions = {
    width: image.width, 
    height: image.height
  };
  
  this.renderQueue = [];
  
  Caman.store[this.canvas_id] = this;
  
  callback.call(this, this);
  
  return this;
};

Caman.manip = Caman.prototype = {
  loadImage: function (image_id, callback) {
    var domLoaded,
    self = this,
    image, proxyURL,
    startFn = function () {
      var canvas = document.createElement('canvas');
      
      if($(image_id) === null || $(image_id).nodeName.toLowerCase() !== 'img') {
        // element doesn't exist or isn't an image
        throw "Given element ID isn't an image: " + image_id;
      }

      canvas.id = image.id;
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
      
      if (image_id.id) {
        image_id = element.id;
      } else {
        image_id = "caman-" + Caman.uniqid.get();
        element.id = image_id;
      }
    }

    // Need to see if DOM is loaded
    domLoaded = ($(image_id) !== null);
    if (domLoaded) {
      image = $(image_id);
      proxyURL = remoteCheck(image.src);
      
      if (proxyURL) {
        // Image is remote. Reload image via proxy
        image.src = proxyURL;
        
        image.onload = function () {
          startFn.call(self);
        };
      } else {
        startFn.call(this);
      }
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        image = $(image_id);
        proxyURL = remoteCheck(image.src);
        
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
  
  loadCanvas: function (url, canvas_id, callback) {
    var domLoaded,
    self = this,
    startFn = function () {
      var canvas = $(canvas_id),
      image = document.createElement('img'),
      proxyURL = remoteCheck(url);
      
      if ($(canvas_id) === null || $(canvas_id).nodeName.toLowerCase() !== 'canvas') {
        // element doesn't exist or isn't a canvas
        throw "Given element ID isn't a canvas: " + canvas_id;
      }
      
      image.onload = function () {
        finishInit.call(self, image, canvas, callback);
      };
      
      if (proxyURL) {
        image.src = proxyURL;
      } else {
        image.src = url;
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
    domLoaded = ($(canvas_id) !== null);
    if (domLoaded) {
      startFn.call(this);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        startFn.call(self);
      }, false);
    }
    
    return this;
  },
  
  /*
   * Grabs the canvas data, encodes it to Base64, then
   * sets the browser location to the encoded data so that
   * the user will be prompted to download it.
   */
  save: function (type) {
    if (type) {
      type = type.toLowerCase();
    }
    
    if (!type || (type !== 'png' && type !== 'jpg')) {
      type = 'png';
    }
    
    document.location.href = this.toBase64(type).replace("image/" + type, "image/octet-stream");
  },
  
  /*
   * Takes the current canvas data, converts it to Base64, then
   * sets it as the source of a new Image object and returns it.
   */
  toImage: function (type) {
    var img;
    
    img = document.createElement('img');
    img.src = this.toBase64(type);
    
    return img;
  },
  
  /*
   * Grabs the current canvas data and Base64 encodes it.
   */
  toBase64: function (type) {
    if (type) {
      type = type.toLowerCase();
    }
    
    if (!type || (type !== 'png' && type !== 'jpg')) {
      type = 'png';
    }
    
    return this.canvas.toDataURL("image/" + type);
  },
  
  revert: function (ready) {
    this.loadCanvas(this.options.image, this.options.canvas, ready);
  },
  
  render: function (callback) {
    this.processNext(function () {
      this.context.putImageData(this.image_data, 0, 0);
      
      if (typeof callback === 'function') {
        callback.call(this);
      }
    });    
  }
};

Caman.manip.loadImage.prototype = Caman.manip;
Caman.manip.loadCanvas.prototype = Caman.manip;

/*
 * Utility forEach function for iterating over
 * objects/arrays.
 */
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

/*
 * Used for extending the Caman object, primarily to
 * add new functionality to the base library.
 */
Caman.extend = function( obj ) {
  var dest = obj, src = slice.call(arguments, 1);


  Caman.forEach( src, function( copy ) {
    for ( var prop in copy ) {
      dest[prop] = copy[prop];
    }
  });
  return dest;      
};

/*
 * CamanJS event system
 * Events can be subscribed to using Caman.listen() and events
 * can be triggered using Caman.trigger().
 */
Caman.events  = {
  types: [ "processStart", "processComplete", "renderFinished" ],
  fn: {
    
    /*
     * Triggers an event with the given target name.
     */
    trigger: function ( target, type, data ) {
      
      var _target = target, _type = type, _data = data;
    
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _data = type;
      }
    
      if ( Caman.events.fn[_type] && Caman.sizeOf(Caman.events.fn[_type]) ) {

        Caman.forEach(Caman.events.fn[_type], function ( obj, key ) {

          obj.call(_target, _data);
        
        });
      }
    },
    
    /*
     * Registers a callback function to be fired when a certain
     * event occurs.
     */
    listen: function ( target, type, fn ) {

      var _target = target, _type = type, _fn = fn;
    
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _fn = type;
      }        

      if ( !Caman.events.fn[_type] ) {
        Caman.events.fn[_type] = [];
      }

      Caman.events.fn[_type].push(_fn);
      
      return true;
    }
  },
  cache: {} 
};

// Basic event system
(function (Caman) {
  
  Caman.forEach( ["trigger", "listen"], function ( key ) {
    Caman[key] = Caman.events.fn[key];
  });  
  
})(Caman);

/*
 * SINGLE = traverse the image 1 pixel at a time
 * KERNEL = traverse the image using convolution kernels
 * LAYER_DEQUEUE = shift a layer off the canvasQueue
 * LAYER_FINISHED = finished processing a layer
 */
var ProcessType = {
  SINGLE: 1,
  KERNEL: 2,
  LAYER_DEQUEUE: 3,
  LAYER_FINISHED: 4,
  LOAD_OVERLAY: 5
};

/*
 * Allows the currently rendering filter to get data about
 * surrounding pixels relative to the pixel currently being
 * processed. The data returned is identical in format to the
 * rgba object provided in the process function.
 *
 * Example: to get data about the pixel to the top-right
 * of the currently processing pixel, you can call (within the process
 * function):
 *    this.getPixel(1, -1);
 */
Caman.manip.pixelInfo = function (loc, self) {
  this.loc = loc;
  this.manip = self;
};

Caman.manip.pixelInfo.prototype.locationXY = function () {
  var x, y;
  
  y = this.manip.dimensions.height - Math.floor(this.loc / (this.manip.dimensions.width * 4));
  x = ((this.loc % (this.manip.dimensions.width * 4)) / 4) - 1;
  
  return {x: x, y: y};
};
  
Caman.manip.pixelInfo.prototype.getPixelRelative = function (horiz_offset, vert_offset) {
  // We invert the vert_offset in order to make the coordinate system non-inverted. In laymans
  // terms: -1 means down and +1 means up.
  var newLoc = this.loc + (this.manip.dimensions.width * 4 * (vert_offset * -1)) + (4 * horiz_offset);
  
  // error handling
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
    
Caman.manip.pixelInfo.prototype.putPixelRelative = function (horiz_offset, vert_offset, rgba) {
  var newLoc = this.loc + (this.manip.dimensions.width * 4 * (vert_offset * -1)) + (4 * horiz_offset);
  
  // error handling
  if (newLoc > this.manip.pixel_data.length || newLoc < 0) {
    return false;
  }
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] =  rgba.a;
};
    
Caman.manip.pixelInfo.prototype.getPixel = function (x, y) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  return {
    r: this.manip.pixel_data[newLoc],
    g: this.manip.pixel_data[newLoc+1],
    b: this.manip.pixel_data[newLoc+2],
    a: this.manip.pixel_data[newLoc+3]
  };
};
    
Caman.manip.pixelInfo.prototype.putPixel = function (x, y, rgba) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] = rgba.a;
};

/*
 * The CamanJS layering system
 */
Caman.manip.canvasQueue = [];

Caman.manip.newLayer = function (callback) {
  var layer = new Caman.manip.canvasLayer(this);
  this.canvasQueue.push(layer);

  this.renderQueue.push({type: ProcessType.LAYER_DEQUEUE});  
  callback.call(layer);
  this.renderQueue.push({type: ProcessType.LAYER_FINISHED});

  return this;
};
 
Caman.manip.canvasLayer = function (manip) {  
  // Default options
  this.options = {
    blendingMode: 'normal',
    opacity: 1.0
  };
  
  // Create a blank and invisible canvas and append it to the document
  this.layerID = Caman.uniqid.get();
  this.canvas = document.createElement('canvas');
  this.canvas.width = manip.dimensions.width;
  this.canvas.height = manip.dimensions.height;
  this.canvas.style.display = 'none';
  
  this.context = this.canvas.getContext("2d");
  this.context.createImageData(this.canvas.width, this.canvas.height);
  this.image_data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  this.pixel_data = this.image_data.data;

  this.__defineGetter__("filter", function () {
    return manip;
  });

  return this;
};

Caman.manip.canvasLayer.prototype.newLayer = function (callback) {
  return this.filter.newLayer.call(this.filter, callback);
};

Caman.manip.canvasLayer.prototype.setBlendingMode = function (mode) {
  this.options.blendingMode = mode;
  return this;
};

Caman.manip.canvasLayer.prototype.opacity = function (opacity) {
  this.options.opacity = (opacity / 100);
  return this;
};

Caman.manip.canvasLayer.prototype.copyParent = function () {
  var parentData = this.filter.pixel_data;
  
  for (var i = 0; i < this.pixel_data.length; i += 4) {
    this.pixel_data[i]    = parentData[i];
    this.pixel_data[i+1]  = parentData[i+1];
    this.pixel_data[i+2]  = parentData[i+2];
    this.pixel_data[i+3]  = parentData[i+3];
  }
  
  return this;
};

Caman.manip.canvasLayer.prototype.fillColor = function () {
  this.filter.fillColor.apply(this.filter, arguments);
  return this;
};

Caman.manip.canvasLayer.prototype.overlayImage = function (image) {
  if (image[0] == '#') {
    image = $(image).src;
  } else if (typeof image === "object") {
    image = image.src;
  }
  
  // Some problem, skip to prevent errors
  if (!image) return;
  
  this.filter.renderQueue.push({type: ProcessType.LOAD_OVERLAY, src: image, layer: this});
  
  return this;
};

// Leaving this here for compatibility reasons. It is NO
// LONGER REQUIRED at the end of the layer.
Caman.manip.canvasLayer.prototype.render = function () {};

Caman.manip.canvasLayer.prototype.applyToParent = function () {
  var parentData = this.filter.pixelStack[this.filter.pixelStack.length - 1],
  layerData = this.filter.pixel_data,
  rgbaParent = {},
  rgbaLayer = {},
  result = {};

  for (var i = 0; i < layerData.length; i += 4) {
    rgbaParent = {
      r: parentData[i],
      g: parentData[i+1],
      b: parentData[i+2],
      a: parentData[i+3]
    };
    
    rgbaLayer = {
      r: layerData[i],
      g: layerData[i+1],
      b: layerData[i+2],
      a: layerData[i+3]
    };
    
    result = this.blenders[this.options.blendingMode](rgbaLayer, rgbaParent);
    
    parentData[i]   = rgbaParent.r - ((rgbaParent.r - result.r) * (this.options.opacity * (result.a / 255)));
    parentData[i+1] = rgbaParent.g - ((rgbaParent.g - result.g) * (this.options.opacity * (result.a / 255)));
    parentData[i+2] = rgbaParent.b - ((rgbaParent.b - result.b) * (this.options.opacity * (result.a / 255)));
    parentData[i+3] = 255;
  }
};

// Blending functions
Caman.manip.canvasLayer.prototype.blenders = {
  normal: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaLayer.r,
      g: rgbaLayer.g,
      b: rgbaLayer.b,
      a: 255
    };
  },
  
  multiply: function (rgbaLayer, rgbaParent) {
    return {
      r: (rgbaLayer.r * rgbaParent.r) / 255,
      g: (rgbaLayer.g * rgbaParent.g) / 255,
      b: (rgbaLayer.b * rgbaParent.b) / 255,
      a: 255
    };
  },
  
  screen: function (rgbaLayer, rgbaParent) {
    return {
      r: 255 - (((255 - rgbaLayer.r) * (255 - rgbaParent.r)) / 255),
      g: 255 - (((255 - rgbaLayer.g) * (255 - rgbaParent.g)) / 255),
      b: 255 - (((255 - rgbaLayer.b) * (255 - rgbaParent.b)) / 255),
      a: 255
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
    
    result.a = 255;
    return result;
  },
  
  difference: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaLayer.r - rgbaParent.r,
      g: rgbaLayer.g - rgbaParent.g,
      b: rgbaLayer.b - rgbaParent.b,
      a: 255
    };
  },
  
  addition: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaParent.r + rgbaLayer.r,
      g: rgbaParent.g + rgbaLayer.g,
      b: rgbaParent.b + rgbaLayer.b,
      a: 255
    };
  },
  
  exclusion: function (rgbaLayer, rgbaParent) {
    return {
      r: 128 - 2 * (rgbaParent.r - 128) * (rgbaLayer.r - 128) / 255,
      g: 128 - 2 * (rgbaParent.g - 128) * (rgbaLayer.g - 128) / 255,
      b: 128 - 2 * (rgbaParent.b - 128) * (rgbaLayer.b - 128) / 255,
      a: 255
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
      
    result.a = 255;
    return result;
  }
};

Caman.manip.blenders = Caman.manip.canvasLayer.prototype.blenders;

/*
 * Convolution kernel processing
 */
Caman.extend( Caman, {  
  processKernel: function (adjust, kernel, divisor, bias) {
    var val = {r: 0, g: 0, b: 0};
    
    for (var i = 0, len = adjust.length; i < len; i++) {
      val.r += adjust[i] * kernel[i * 3];
      val.g += adjust[i] * kernel[i * 3 + 1];
      val.b += adjust[i] * kernel[i * 3 + 2];
    }
    
    val.r = (val.r / divisor) + bias;
    val.g = (val.g / divisor) + bias;
    val.b = (val.b / divisor) + bias;

    return val;
  }
});

/*
 * The core of the image rendering, this function executes
 * the provided filter and updates the canvas pixel data
 * accordingly. NOTE: this does not write the updated pixel
 * data to the canvas. That happens when all filters are finished
 * rendering in order to be as fast as possible.
 */
Caman.manip.executeFilter = function (adjust, processFn, type) {
  var n = this.pixel_data.length,
  res = null,
  
  // (n/4) == # of pixels in image
  // Give remaining pixels to last block in case it doesn't
  // divide evenly.
  blockPixelLength = Math.floor((n / 4) / Caman.renderBlocks),
  
  // expand it again to make the loop easier.
  blockN = blockPixelLength * 4,
  
  // add the remainder pixels to the last block.
  lastBlockN = blockN + ((n / 4) % Caman.renderBlocks) * 4,

  self = this,
  
  blocks_done = 0,
  
  // Called whenever a block finishes. It's used to determine when all blocks
  // finish rendering.
  block_finished = function (bnum) {
    if (bnum >= 0) {
      console.log("Block #" + bnum + " finished! Filter: " + processFn.name);
    }
    
    blocks_done++;

    if (blocks_done == Caman.renderBlocks || bnum == -1) {
      if (bnum >= 0) {
        console.log("Filter " + processFn.name + " finished!");
      } else {
        console.log("Kernel filter finished!");
      }
      
      Caman.trigger("processComplete", {id: self.canvas_id, completed: processFn.name});
      
      self.processNext();
    }
  },
  
  /*
   * Renders a block of the image bounded by the start and end
   * parameters.
   */
  render_block = function (bnum, start, end) {
    console.log("BLOCK #" + bnum + " - Filter: " + processFn.name + ", Start: " + start + ", End: " + end);
    
    setTimeout(function () {
      var data = {r: 0, g: 0, b: 0, a: 0};
      for (var i = start; i < end; i += 4) {
        data.r = self.pixel_data[i];
        data.g = self.pixel_data[i+1];
        data.b = self.pixel_data[i+2];
        data.a = self.pixel_data[i+3];
        
        res = processFn.call(new self.pixelInfo(i, self), adjust, data);
        
        self.pixel_data[i]   = res.r;
        self.pixel_data[i+1] = res.g;
        self.pixel_data[i+2] = res.b;
        self.pixel_data[i+3] = res.a;
      }
      
      block_finished(bnum);
    }, 0);
  },
  
  render_kernel = function () {
    setTimeout(function () {
      var kernel = [],
      pixelInfo, pixel,
      start, end, 
      mod_pixel_data,
      name = adjust.name,
      bias = adjust.bias,
      divisor = adjust.divisor,
      adjustSize,
      builder, builder_index,
      i, j, k;
      
      adjust = adjust.adjust;
      adjustSize = Math.sqrt(adjust.length);
      
      mod_pixel_data = [];
      
      console.log("Rendering kernel - Filter: " + name);
      
      start = self.dimensions.width * 4 * ((adjustSize - 1) / 2);
      end = n - (self.dimensions.width * 4 * ((adjustSize - 1) / 2));
      
      builder = (adjustSize - 1) / 2;
      
      for (i = start; i < end; i += 4) {
        pixelInfo = new self.pixelInfo(i, self);
        
        builder_index = 0;
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
        mod_pixel_data[i]   = res.r;
        mod_pixel_data[i+1] = res.g;
        mod_pixel_data[i+2] = res.b;
        mod_pixel_data[i+3] = 255;
      }

      // Update the actual canvas pixel data. Unfortunately we have to set
      // this one by one.
      for (i = start; i < end; i++) {
        self.pixel_data[i] = mod_pixel_data[i];
      }
      
      block_finished(-1);
      
    }, 0);
  };
  
  Caman.trigger("processStart", {id: this.canvas_id, start: processFn.name});
  
  if (type === ProcessType.SINGLE) {
    // Split the image into its blocks.
    for (var j = 0; j < Caman.renderBlocks; j++) {
     var start = j * blockN,
     end = start + ((j == Caman.renderBlocks - 1) ? lastBlockN : blockN);
     render_block(j, start, end);
    }
  } else {
    render_kernel();
  }
};

Caman.manip.executeLayer = function (layer) {
  this.pushContext(layer);
  this.processNext();
};

Caman.manip.pushContext = function (layer) {
  console.log("PUSH LAYER!");
  
  this.layerStack.push(this.currentLayer);
  this.pixelStack.push(this.pixel_data);
  
  this.currentLayer = layer;
  this.pixel_data = layer.pixel_data;
};

Caman.manip.popContext = function () {
  console.log("POP LAYER!");
  
  this.pixel_data = this.pixelStack.pop();
  this.currentLayer = this.layerStack.pop();
};

Caman.manip.applyCurrentLayer = function () {
  this.currentLayer.applyToParent();
};

Caman.manip.loadOverlay = function (layer, src) {
  var proxyUrl = remoteCheck(src),
  self = this;
  
  if (proxyUrl) {
    src = proxyUrl;
  }
  
  var img = document.createElement('img');
  img.onload = function () {
    layer.context.drawImage(img, 0, 0, self.dimensions.width, self.dimensions.height);
    layer.image_data = layer.context.getImageData(0, 0, self.dimensions.width, self.dimensions.height);
    layer.pixel_data = layer.image_data.data;
    
    self.pixel_data = layer.pixel_data;
    
    self.processNext();
  };
  img.src = src;
};

Caman.manip.process = function (adjust, processFn) {
  // Since the block-based renderer is asynchronous, we simply build
  // up a render queue and execute the filters in order once
  // render() is called instead of executing them as they're called
  // synchronously.
  this.renderQueue.push({adjust: adjust, processFn: processFn, type: ProcessType.SINGLE});
  
  return this;
};

Caman.manip.processKernel = function (name, adjust, divisor, bias) {  
  if (!divisor) {
    divisor = 0;

    for (var i = 0, len = adjust.length; i < len; i++) {
      divisor += adjust[i];
    }
  }
  
  var data = {
    name: name,
    adjust: adjust,
    divisor: divisor,
    bias: bias || 0
  };
  
  this.renderQueue.push({adjust: data, processFn: Caman.processKernel, type: ProcessType.KERNEL});
  
  return this;
};

/*
 * Begins the render process if it's not started, or moves to the next
 * filter in the queue and processes it. Calls the finishedFn callback
 * when the render queue is empty.
 */
Caman.manip.processNext = function (finishedFn) {
  if (typeof finishedFn === "function") {
    this.finishedFn = finishedFn;
  }
  
  if (this.renderQueue.length === 0) {
    Caman.trigger("renderFinished", {id: this.canvas_id});
    
    if (typeof this.finishedFn === "function") {
      this.finishedFn.call(this);
    }
    
    return;
  }
  
  var next = this.renderQueue.shift();
  
  if (next.type == ProcessType.LAYER_DEQUEUE) {
    var layer = this.canvasQueue.shift();
    this.executeLayer(layer);
  } else if (next.type == ProcessType.LAYER_FINISHED) {
    this.applyCurrentLayer();
    this.popContext();
    this.processNext();
  } else if (next.type == ProcessType.LOAD_OVERLAY) {
    this.loadOverlay(next.layer, next.src);
  } else {
    this.executeFilter(next.adjust, next.processFn, next.type);
  }
};

// Expose Caman to the world!
window.Caman = Caman;

}());