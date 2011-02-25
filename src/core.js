/*!
 * CamanJS - Pure HTML5 Javascript (Ca)nvas (Man)ipulation
 * http://camanjs.com/
 *
 * Copyright 2011, Ryan LeFevre
 * Licensed under the new BSD License.
 * See LICENSE for more info.
 *
 * Project Contributors:
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
  
  canvas.width = image.width;
  canvas.height = image.height;
  
  this.canvas = canvas;
  this.context = canvas.getContext("2d");
  this.context.drawImage(image, 0, 0);
  
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
    startFn = function () {
      var canvas = document.createElement('canvas'),
      image = $(image_id),
      proxyURL = remoteCheck(image.src);
      
      if($(image_id) === null || $(image_id).nodeName.toLowerCase() !== 'img') {
        // element doesn't exist or isn't an image
        throw "Given element ID isn't an image: " + image_id;
      }

      canvas.id = image.id;
      image.parentNode.replaceChild(canvas, image);
      
      if (proxyURL) {
        // Image is remote. Reload image via proxy
        image.src = proxyURL;
      }
      
      // Store the canvas ID
      this.canvas_id = image_id;
      
      this.options = {
        canvas: image_id,
        image: image.src
      };
      
      // Ugh... Firefox 4 has some timing issues here
      image.onload = function () {
        finishInit.call(self, image, canvas, callback);
      };
      
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
      startFn.call(this);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        startFn.call(self);
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

      image.onload = function () {
        finishInit.call(self, image, canvas, callback);
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
  LAYER_FINISHED: 4
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
  this.canvas.id = 'camanlayer-' + this.layerID;
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
};

// Leaving this here for compatibility reasons. It is NO
// LONGER REQUIRED at the end of the layer.
Caman.manip.canvasLayer.prototype.render = function () {};

Caman.manip.canvasLayer.prototype.applyToParent = function () {
  var parentData = this.filter.pixelStack[this.filter.pixelStack.length - 1],
  layerData = this.filter.pixel_data,
  rgbaParent = {},
  rgbaLayer = {};
  
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
    
    rgbaParent = this.blenders[this.options.blendingMode](rgbaLayer, rgbaParent);
    
    parentData[i]   = rgbaParent.r - ((rgbaParent.r - rgbaLayer.r) * this.options.opacity);
    parentData[i+1] = rgbaParent.g - ((rgbaParent.g - rgbaLayer.g) * this.options.opacity);
    parentData[i+2] = rgbaParent.b - ((rgbaParent.b - rgbaLayer.b) * this.options.opacity);
    parentData[i+3] = 255;
  }
};

// Blending functions
Caman.manip.canvasLayer.prototype.blenders = {
  normal: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = rgbaLayer.r;
    rgbaParent.g = rgbaLayer.g;
    rgbaParent.b = rgbaLayer.b;
    
    return rgbaParent;
  },
  
  multiply: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = (rgbaLayer.r * rgbaParent.r) / 255;
    rgbaParent.g = (rgbaLayer.g * rgbaParent.g) / 255;
    rgbaParent.b = (rgbaLayer.b * rgbaParent.b) / 255;
    
    return rgbaParent;
  },
  
  screen: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = 255 - (((255 - rgbaLayer.r) * (255 - rgbaParent.r)) / 255);
    rgbaParent.g = 255 - (((255 - rgbaLayer.g) * (255 - rgbaParent.g)) / 255);
    rgbaParent.b = 255 - (((255 - rgbaLayer.b) * (255 - rgbaParent.b)) / 255);
    
    return rgbaParent;
  },
  
  overlay: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = 
      (rgbaParent.r > 128) ? 
        255 - 2 * (255 - rgbaLayer.r) * (255 - rgbaParent.r) / 255: 
        (rgbaParent.r * rgbaLayer.r * 2) / 255;
        
    rgbaParent.g = 
      (rgbaParent.g > 128) ? 
        255 - 2 * (255 - rgbaLayer.g) * (255 - rgbaParent.g) / 255: 
        (rgbaParent.g * rgbaLayer.g * 2) / 255;
        
    rgbaParent.b = 
      (rgbaParent.b > 128) ? 
        255 - 2 * (255 - rgbaLayer.b) * (255 - rgbaParent.b) / 255: 
        (rgbaParent.b * rgbaLayer.b * 2) / 255;
    
    return rgbaParent;
  },
  
  difference: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = rgbaLayer.r - rgbaParent.r;
    rgbaParent.g = rgbaLayer.g - rgbaParent.g;
    rgbaParent.b = rgbaLayer.b - rgbaParent.b;
    
    return rgbaParent;
  },
  
  addition: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = rgbaParent.r + rgbaLayer.r;
    rgbaParent.g = rgbaParent.g + rgbaLayer.g;
    rgbaParent.b = rgbaParent.b + rgbaLayer.b;
    
    return rgbaParent;
  },
  
  exclusion: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = 128 - 2 * (rgbaParent.r - 128) * (rgbaLayer.r - 128) / 255;
    rgbaParent.g = 128 - 2 * (rgbaParent.g - 128) * (rgbaLayer.g - 128) / 255;
    rgbaParent.b = 128 - 2 * (rgbaParent.b - 128) * (rgbaLayer.b - 128) / 255;
    
    return rgbaParent;
  },
  
  softLight: function (rgbaLayer, rgbaParent) {
    rgbaParent.r = 
      (rgbaParent.r > 128) ? 
        255 - ((255 - rgbaParent.r) * (255 - (rgbaLayer.r - 128))) / 255 : 
        (rgbaParent.r * (rgbaLayer.r + 128)) / 255;
      
    rgbaParent.g = 
      (rgbaParent.g > 128) ? 
        255 - ((255 - rgbaParent.g) * (255 - (rgbaLayer.g - 128))) / 255 : 
        (rgbaParent.g * (rgbaLayer.g + 128)) / 255;
    
    rgbaParent.b = (rgbaParent.b > 128) ? 
      255 - ((255 - rgbaParent.b) * (255 - (rgbaLayer.b - 128))) / 255 : 
      (rgbaParent.b * (rgbaLayer.b + 128)) / 255;
      
    return rgbaParent;
  }
};

Caman.manip.blenders = Caman.manip.canvasLayer.prototype.blenders;

/*
 * Convolution kernel processing
 */
Caman.extend( Caman, {
  processKernel: function (adjust, kernel, divisor, bias) {
    var val = {
      r: 0,
      g: 0,
      b: 0
    };
    
    for (var i = 0; i < adjust.length; i++) {
      for (var j = 0; j < adjust[i].length; j++) {
        val.r += (adjust[i][j] * kernel[i][j].r);
        val.g += (adjust[i][j] * kernel[i][j].g);
        val.b += (adjust[i][j] * kernel[i][j].b);
      }
    }
    
    val.r = (val.r / divisor) + bias;
    val.g = (val.g / divisor) + bias;
    val.b = (val.b / divisor) + bias;
    
    if (val.r > 255) {
      val.r = 255;
    } else if (val.r < 0) {
      val.r = 0;
    }

    if (val.g > 255) {
      val.g = 255;
    } else if (val.g < 0) {
      val.g = 0;
    }
    
    if (val.b > 255) {
      val.b = 255;
    } else if (val.b < 0) {
      val.b = 0;
    }
    
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
      for (var i = start; i < end; i += 4) {
        res = processFn.call(new self.pixelInfo(i, self), adjust, {
          r: self.pixel_data[i], 
          g: self.pixel_data[i+1], 
          b: self.pixel_data[i+2], 
          a: self.pixel_data[i+3]
        });
        
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
      pixelInfo, 
      start, end, 
      mod_pixel_data = [],
      name = adjust.name,
      bias = adjust.bias,
      divisor = adjust.divisor,
      builder_start,
      builder_end,
      i, j, k;
      
      adjust = adjust.adjust;
      
      builder_start = (adjust.length - 1) / 2;
      builder_end = builder_start * -1;
      
      console.log("Rendering kernel - Filter: " + name);
      
      start = self.dimensions.width * 4 * ((adjust.length - 1) / 2);
      end = n - (self.dimensions.width * 4 * ((adjust.length - 1) / 2));
      
      // Prepare the convolution kernel array
      for (i = 0; i < adjust.length; i++) {
        kernel[i] = [];
      }
      
      for (i = start; i < end; i += 4) {
        pixelInfo = new self.pixelInfo(i, self);
        
        // Fill the convolution kernel with values
        for (j = builder_start; j >= builder_end; j--) {
          for (k = builder_end; k <= builder_start; k++) {
            kernel[k + ((adjust.length - 1) / 2)][((adjust.length - 1) / 2) - j] = pixelInfo.getPixelRelative(k, j);
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

      // Update the actual canvas pixel data
      for (i = start; i < end; i++) {
        self.pixel_data[i] = mod_pixel_data[i];
      }
      
      block_finished(-1);
      
    }, 0);
  };
  
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
    for (var i = 0; i < adjust.length; i++) {
      for (var j = 0; j < adjust[i].length; j++) {
        divisor += adjust[i][j];
      }
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
  } else {
    this.executeFilter(next.adjust, next.processFn, next.type);
  }
};

// Expose Caman to the world!
window.Caman = Caman;

}());