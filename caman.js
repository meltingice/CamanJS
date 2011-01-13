/*!
 * CamanJS - Image Manipulation Library
 * http://camanjs.com/
 *
 * Copyright 2011, Ryan LeFevre
 * Licensed under the new BSD License.
 * See LICENSE for more info.
 */
 
(function () {

var forEach = Array.prototype.forEach,
hasOwn = Object.prototype.hasOwnProperty,
slice = Array.prototype.slice,

Caman = function ( options ) {
  if ( typeof options === "string" ) {
    var temp = options;
        
    if ( arguments.length === 1 ) {
      options = temp;
    } else {
      options = {
        src: temp,
        canvas: arguments[1] || "",
        ready: arguments[2] || false
      };
    }
  }
      
  if ( options.context && options.canvas_id ) {
    options = options.canvas_id;
  }
      
  return new Caman.manip.load(options);
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

/*
 * Object that represents a single pixel. Originally this was,
 * expressed with an object literal, but it has been changed in
 * order to speed up execution slightly. From a filter standpoint,
 * everything works exactly the same as it did before.
 */
var RGBPixel = function (r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a || 1;
};

RGBPixel.prototype.toHSL = function () {
  return Caman.rgb_to_hsl(this.r, this.g, this.b);
};

RGBPixel.prototype.toHSV = function () {
  return Caman.rgb_to_hsv(this.r, this.g, this.b);
};

RGBPixel.prototype.toXYZ = function () {
  return Caman.rgb_to_xyz(this.r, this.g, this.b);
};

/*
 * Object representation of a pixel in HSL color format.
 */
var HSLPixel = function (h, s, l) {
  this.h = h;
  this.s = s;
  this.l = l;
};

HSLPixel.prototype.toRGB = function () {
  return Caman.hsl_to_rgb(this.h, this.s, this.l);
};

/*
 * Object representation of a pixel in HSV color format.
 */
var HSVPixel = function (h, s, v) {
  this.h = h;
  this.s = s;
  this.v = v;
};

HSVPixel.prototype.toRGB = function () {
  return Caman.hsv_to_rgb(this.h, this.s, this.v);
};

/*
 * Object representation of a pixel in XYZ color format.
 */
var XYZPixel = function (x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
};

XYZPixel.prototype.toRGB = function () {
  return Caman.xyz_to_rgb(this.x, this.y, this.z);
};

XYZPixel.prototype.toLAB = function () {
  return Caman.xyz_to_lab(this.x, this.y, this.z);
};

/*
 * Object representation of a pixel in LAB color format.
 */
var LABPixel = function (l, a, b) {
  this.l = l;
  this.a = a;
  this.b = b;
};

LABPixel.prototype.toXYZ = function () {
  return Caman.lab_to_xyz(this.l, this.a, this.b);
};

Caman.manip = Caman.prototype = {
  /*
   * Sets up everything that needs to be done before the filter
   * functions can be run. This includes loading the image into
   * the canvas element and saving lots of different data about
   * the image.
   */
  load: function(options) {
    var 
      img = document.createElement("img"),
      
      /*
       * Called once the image is loaded from the server
       */
      imageReady = function( ) {
  
        var args  = arguments.length, 
          canvas_id = !args ? options.canvas : arguments[0],
          canvas;
        
        if ( !args && canvas_id.substr(0, 1) === "#") {
          canvas = document.getElementById(canvas_id.substr(1));
          if (!canvas) {
            return;
          }  
        } else {
          
          return Caman.store[canvas_id];
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        this.canvas = canvas;
        this.canvas_id = canvas_id;
        this.context = canvas.getContext("2d");
        this.context.drawImage(img, 0, 0);
        this.image_data = this.context.getImageData(0, 0, img.width, img.height);
        
        this.pixel_data = this.image_data.data;

        this.dimensions = {
          width: img.width, 
          height: img.height
        };
        
        this.renderQueue = [];
        
        options.ready && options.ready.call(this, this);
      
        Caman.store[canvas_id] = this;
  
        return this;
        
      }, that = this;
      
    // Save the options for later use.
    this.options = options;
    
    if ( typeof options !== "string" ) {
  
      img.src = options.src; 
  
      img.onload = function() {
         imageReady.call(that);
      };
      
      if ( !Caman.ready ) {
        document.addEventListener("DOMContentLoaded", function() {
          Caman.ready = true;
        }, false);          
      }
      
    } else {
      // Handle Caman('#index')
      return Caman.store[options];
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
    
    var data = this.toBase64(type).replace("image/" + type, "image/octet-stream");
    document.location.href = data;
  },
  
  /*
   * Takes the current canvas data, converts it to Base64, then
   * sets it as the source of a new Image object and returns it.
   */
  toImage: function (type) {
    var img, data;
    
    data = this.toBase64(type);
    
    img = document.createElement('img');
    img.src = data;
    
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
  
  revert: function () {
    this.options.ready = function () {};
    this.load(this.options);
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

Caman.manip.load.prototype = Caman.manip;

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

Caman.extend( Caman, {
  /*
   * Returns the size of an object (the number of properties
   * the object has)
   */
  sizeOf: function ( obj ) {
    var size = 0,
        prop;
    
    for ( prop in obj  ) {
      size++;
    }
            
    return size;
  },
  
  /*
   * Determines whether two given objects are the same based
   * on their properties and values.
   */
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
  
  /*
   * Removes items with the given value from an array if they
   * are present.
   */
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
    
  randomRange: function (min, max, float) {
    var rand = min + (Math.random() * (max - min));
    return typeof float == 'undefined' ? Math.round(rand) : rand.toFixed(float);
  },
  
  /**
   * Converts an RGB color to HSL.
   * Assumes r, g, and b are in the set [0, 255] and
   * returns h, s, and l in the set [0, 1].
   *
   * @param   Number  r   Red channel
   * @param   Number  g   Green channel
   * @param   Number  b   Blue channel
   * @return              The HSL representation
   */
  rgb_to_hsl: function(r, g, b) {
  
    r /= 255, g /= 255, b /= 255;
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
    
    return new HSLPixel(h, s, l);
  },
  
  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   Number  h       The hue
   * @param   Number  s       The saturation
   * @param   Number  l       The lightness
   * @return  Array           The RGB representation
   */
  hsl_to_rgb: function(h, s, l){
      var r, g, b;
  
      if(s == 0){
          r = g = b = l; // achromatic
      } else {
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }
  
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }
      
      return new RGBPixel(r * 255, g * 255, b * 255);
  },
  
  /**
   * Converts an RGB color value to HSV. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and v in the set [0, 1].
   *
   * @param   Number  r       The red color value
   * @param   Number  g       The green color value
   * @param   Number  b       The blue color value
   * @return  Array           The HSV representation
   */
  rgb_to_hsv: function(r, g, b){
      
      r = r/255, g = g/255, b = b/255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b),
          h, s, v = max,
          d = max - min;
          
      s = max == 0 ? 0 : d / max;
  
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
  
      return new HSVPixel(h, s, v);
  },
  
  /**
   * Converts an HSV color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes h, s, and v are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   Number  h       The hue
   * @param   Number  s       The saturation
   * @param   Number  v       The value
   * @return  Array           The RGB representation
   */
  hsv_to_rgb: function(h, s, v){
    
      var r, g, b,
          i = Math.floor(h * 6),
          f = h * 6 - i,
          p = v * (1 - s),
          q = v * (1 - f * s),
          t = v * (1 - (1 - f) * s);
  
      switch(i % 6){
          case 0: r = v, g = t, b = p; break;
          case 1: r = q, g = v, b = p; break;
          case 2: r = p, g = v, b = t; break;
          case 3: r = p, g = q, b = v; break;
          case 4: r = t, g = p, b = v; break;
          case 5: r = v, g = p, b = q; break;
      }
  
      return new RGBPixel(r * 255, g * 255, b * 255);
  },
  
  /**
   * Converts a RGB color value to the XYZ color space. Formulas
   * are based on http://en.wikipedia.org/wiki/SRGB assuming that
   * RGB values are sRGB.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns x, y, and z.
   *
   * @param   Number  r       The red color value
   * @param   Number  g       The green color value
   * @param   Number  b       The blue color value
   * @return  Array           The XYZ representation
   */
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
  
    return new XYZPixel(x * 100, y * 100, z * 100);
  },
  
  /**
   * Converts a XYZ color value to the sRGB color space. Formulas
   * are based on http://en.wikipedia.org/wiki/SRGB and the resulting
   * RGB value will be in the sRGB color space.
   * Assumes x, y and z values are whatever they are and returns
   * r, g and b in the set [0, 255].
   *
   * @param   Number  x       The X value
   * @param   Number  y       The Y value
   * @param   Number  z       The Z value
   * @return  Array           The RGB representation
   */
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
  
    return new RGBPixel(r * 255, g * 255, b * 255);
  },
  
  /**
   * Converts a XYZ color value to the CIELAB color space. Formulas
   * are based on http://en.wikipedia.org/wiki/Lab_color_space
   * The reference white point used in the conversion is D65.
   * Assumes x, y and z values are whatever they are and returns
   * L*, a* and b* values
   *
   * @param   Number  x       The X value
   * @param   Number  y       The Y value
   * @param   Number  z       The Z value
   * @return  Array           The Lab representation
   */
  xyz_to_lab: function(x, y, z) {
  
    // D65 reference white point
    var whiteX = 95.047, whiteY = 100.0, whiteZ = 108.883
  
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
  
    return new LABPixel(l, a, b);
  },
  
  /**
   * Converts a L*, a*, b* color values from the CIELAB color space
   * to the XYZ color space. Formulas are based on
   * http://en.wikipedia.org/wiki/Lab_color_space
   * The reference white point used in the conversion is D65.
   * Assumes L*, a* and b* values are whatever they are and returns
   * x, y and z values.
   *
   * @param   Number  l       The L* value
   * @param   Number  a       The a* value
   * @param   Number  b       The b* value
   * @return  Array           The XYZ representation
   */
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
    return new XYZPixel(x * 95.047, y * 100.0, z * 108.883);
  },
  
  /*
   * Converts the hex representation of a color to RGB values.
   * Hex value can optionally start with the hash (#).
   *
   * @param   String  hex   The colors hex value
   * @return  Array         The RGB representation
   */
  hex_to_rgb: function(hex) {
    var r, g, b;
    
    if (hex.charAt(0) === "#") {
      hex = hex.substr(1);
    }
    
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
    
    return new RGBPixel(r, g, b);
  }
});

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
  cache: {} /*{
    // [type] = { fn.toString() : fn }
    //  types: processStart, processComplete
  }*/
};

// Basic event system
(function (Caman) {
  
  Caman.forEach( ["trigger", "listen"], function ( key ) {
    Caman[key] = Caman.events.fn[key];
  });  
  
})(Caman);

/*
 * Allows the currently rendering filter to get data about
 * surrounding pixels relative to the pixel currently being
 * processed. The data returned is identical in format to the
 * rgba object provided in the process function.
 *
 * Example: to get data about the pixel to the top-right
 * of the currently processing pixel, you can call (within the process
 * function):
 *    this.getRGBPixel(1, -1);
 */
Caman.manip.pixelInfo = function (loc, self) {
  this.loc = loc;
  this.manip = self;
};
  
Caman.manip.pixelInfo.prototype.getRGBPixelRelative = function (horiz_offset, vert_offset) {
  // We invert the vert_offset in order to make the coordinate system non-inverted. In laymans
  // terms: -1 means down and +1 means up.
  var newLoc = this.loc + (this.manip.dimensions.width * (vert_offset * -1)) + (4 * horiz_offset);
  
  // error handling
  if (newLoc > this.manip.pixel_data.length || newLoc < 0) {
    return false;
  }
  
  return {
    r: this.manip.pixel_data[newLoc],
    g: this.manip.pixel_data[newLoc+1],
    b: this.manip.pixel_data[newLoc+2],
    a: this.manip.pixel_data[newLoc+3]
  };
};
    
Caman.manip.pixelInfo.prototype.putRGBPixelRelative = function (horiz_offset, vert_offset, rgba) {
  var newLoc = this.loc + (this.manip.dimensions.width * (vert_offset * -1)) + (4 * horiz_offset);
  
  // error handling
  if (newLoc > this.manip.pixel_data.length || newLoc < 0) {
    return false;
  }
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] =  rgba.a;
};
    
Caman.manip.pixelInfo.prototype.getRGBPixel = function (x, y) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  return {
    r: this.manip.pixel_data[newLoc],
    g: this.manip.pixel_data[newLoc+1],
    b: this.manip.pixel_data[newLoc+2],
    a: this.manip.pixel_data[newLoc+3]
  };
};
    
Caman.manip.pixelInfo.prototype.putRGBPixel = function (x, y, rgba) {
  var newLoc = (y * this.manip.dimensions.width + x) * 4;
  
  this.manip.pixel_data[newLoc]   = rgba.r;
  this.manip.pixel_data[newLoc+1] = rgba.g;
  this.manip.pixel_data[newLoc+2] = rgba.b;
  this.manip.pixel_data[newLoc+3] = rgba.a;
};

/*
 * The core of the image rendering, this function executes
 * the provided filter and updates the canvas pixel data
 * accordingly. NOTE: this does not write the updated pixel
 * data to the canvas. That happens when all filters are finished
 * rendering in order to be as fast as possible.
 */
Caman.manip.executeFilter = function (adjust, processFn) {
  var n = this.pixel_data.length,
  res = null,
  
  // (n/4) == # of pixels in image
  // Give remaining pixels to last block in case it doesn't
  // divide evenly.
  blockRGBPixelLength = Math.floor((n / 4) / Caman.renderBlocks),
  
  // expand it again to make the loop easier.
  blockN = blockRGBPixelLength * 4,
  
  // add the remainder pixels to the last block.
  lastBlockN = blockN + ((n / 4) % Caman.renderBlocks) * 4,
  self = this,
  
  /*
   * Renders a block of the image bounded by the start and end
   * parameters.
   */
  render_block = function (bnum, start, end) {
    console.log("BLOCK #" + bnum + " - Filter: " + processFn.name + ", Start: " + start + ", End: " + end);
    
    setTimeout(function () {
      for (var i = start; i < end; i += 4) {        
        res = processFn.call(new self.pixelInfo(i, self), adjust, new RGBPixel(
          self.pixel_data[i],
          self.pixel_data[i+1],
          self.pixel_data[i+2],
          self.pixel_data[i+3]
        ));
        
        self.pixel_data[i]   = res.r;
        self.pixel_data[i+1] = res.g;
        self.pixel_data[i+2] = res.b;
        self.pixel_data[i+3] = res.a;
      }
      
      block_finished(bnum);
    }, 0);
  },
  
  blocks_done = 0,
  
  // Called whenever a block finishes. It's used to determine when all blocks
  // finish rendering.
  block_finished = function (bnum) {
    console.log("Block #" + bnum + " finished! Filter: " + processFn.name);
    blocks_done++;

    if (blocks_done == Caman.renderBlocks) {
      console.log("Filter " + processFn.name + " finished!");
      Caman.trigger("processComplete", {id: self.canvas_id, completed: processFn.name});
      
      self.processNext();
    }
  };
  
  // Split the image into its blocks.
  for (var j = 0; j < Caman.renderBlocks; j++) {
    var start = j * blockN,
    end = start + ((j == Caman.renderBlocks - 1) ? lastBlockN : blockN);
    render_block(j, start, end);
  }  
};

Caman.manip.process = function (adjust, processFn) {
  // Since the block-based renderer is asynchronous, we simply build
  // up a render queue and execute the filters in order once
  // render() is called instead of executing them as they're called
  // synchronously.
  this.renderQueue.push({adjust: adjust, processFn: processFn});
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
  this.executeFilter(next.adjust, next.processFn);
};

// Expose Caman to the world!
window.Caman = Caman;

/****************************************************************************
 * Below are a basic library of filters that are always loaded with CamanJS *
 ****************************************************************************/
(function(Caman) {

  Caman.manip.brightness = function(adjust) {
    
    adjust = Math.floor(255 * (adjust / 100));
    
    return this.process( adjust,  function brightness(adjust, rgba) {
      rgba.r += adjust;
      rgba.g += adjust;
      rgba.b += adjust;
      
      return rgba;
    });
  };

  Caman.manip.saturation = function(adjust) {
    var chan, max, diff;
    adjust *= -1;
    
    return this.process( adjust, function saturation(adjust, rgba) {
      max = Math.max(rgba.r, rgba.g, rgba.b);
      
      for (chan in rgba) {
        if (rgba.hasOwnProperty(chan)) {
          if (rgba[chan] === max || chan === "a") {
            continue;
          }
            
          diff = max - rgba[chan];
          rgba[chan] += Math.ceil(diff * (adjust / 100));
        }
      }
      
      return rgba;
    });
  };
  
  /*
   * An improved greyscale function that should make prettier results
   * than simply using the saturation filter to remove color. There are
   * no arguments, it simply makes the image greyscale with no in-between.
   *
   * Algorithm adopted from http://www.phpied.com/image-fun/
   */
  Caman.manip.greyscale = function () {
    return this.process({}, function greyscale(adjust, rgba) {
      var avg = 0.3 * rgba.r + 0.59 * rgba.g + 0.11 * rgba.b;
      
      rgba.r = avg;
      rgba.g = avg;
      rgba.b = avg;
      
      return rgba;
    });
  };
  
  Caman.manip.contrast = function(adjust) {

    adjust = Math.pow((100 + adjust) / 100, 2);
    
    return this.process( adjust, function contrast(adjust, rgba) {  
      var chan;
      for (chan in rgba) {
        if (rgba.hasOwnProperty(chan)) {
          // skip the alpha channel
          if (chan === 'a') { continue; }
          
          rgba[chan] /= 255;
          rgba[chan] -= 0.5;
          rgba[chan] *= adjust;
          rgba[chan] += 0.5;
          rgba[chan] *= 255;
          
          // While uglier, I found that using if statements are
          // faster than calling Math.max() and Math.min() to bound
          // the numbers.
          if (rgba[chan] > 255) {
            rgba[chan] = 255;
          } else if (rgba[chan] < 0) {
            rgba[chan] = 0;
          }
        }
      }
              
      return rgba;
    });
  };
  
  Caman.manip.hue = function(adjust) {
    var hsv, h;
       
    return this.process( adjust, function hue(adjust, rgba) {
      hsv = rgba.toHSV();
      h = hsv.h * 100;
      h += Math.abs(adjust);
      h = h % 100;
      h /= 100;
      hsv.h = h;
      
      return hsv.toRGB();
    });
  };
  
  Caman.manip.colorize = function() {
    var diff, rgb, level;
            
    if (arguments.length === 2) {
      rgb = Caman.hex_to_rgb(arguments[0]);
      level = arguments[1];
    } else if (arguments.length === 4) {
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
  
  Caman.manip.invert = function () {
    return this.process({}, function invert (adjust, rgba) {
      rgba.r = 255 - rgba.r;
      rgba.g = 255 - rgba.g;
      rgba.b = 255 - rgba.b;
      
      return rgba;
    });
  };
  
  /*
   * Applies a sepia filter to the image. Assumes adjustment is between 0 and 100,
   * which represents how much the sepia filter is applied.
   */
  Caman.manip.sepia = function (adjust) {
    if (adjust === undefined) {
      adjust = 100;
    }
    
    adjust = (adjust / 100);
    
    return this.process(adjust, function sepia (adjust, rgba) {
      rgba.r = Math.min(255, (rgba.r * (1 - (.607 * adjust))) + (rgba.g * (.769 * adjust)) + (rgba.b * (.189 * adjust)));
      rgba.g = Math.min(255, (rgba.r * (.349 * adjust)) + (rgba.g * (1 - (.314 * adjust))) + (rgba.b * (.168 * adjust)));
      rgba.b = Math.min(255, (rgba.r * (.272 * adjust)) + (rgba.g * (.534 * adjust)) + (rgba.b * (1- (.869 * adjust))));
      
      return rgba;
    });
  };
  
  /*
   * Adjusts the gamma of the image. I would stick with low values to be safe.
   */
  Caman.manip.gamma = function (adjust) {
    return this.process(adjust, function gamma(adjust, rgba) {
      rgba.r = Math.pow(rgba.r / 255, adjust) * 255;
      rgba.g = Math.pow(rgba.g / 255, adjust) * 255;
      rgba.b = Math.pow(rgba.b / 255, adjust) * 255;
      
      return rgba;
    });
  };
  
  /*
   * Adds noise to the image on a scale from 1 - 100
   * However, the scale isn't constrained, so you can specify
   * a value > 100 if you want a LOT of noise.
   */
  Caman.manip.noise = function (adjust) {
    adjust = Math.abs(adjust) * 2.55;
    return this.process(adjust, function noise(adjust, rgba) {
      var rand = Caman.randomRange(adjust*-1, adjust);
      rgba.r += rand;
      rgba.g += rand;
      rgba.b += rand;
      
      return rgba;
    });
  };
  
  /*
   * Clips a color to max values when it falls outside of the specified range.
   * User supplied value should be between 0 and 100.
   */
  Caman.manip.clip = function (adjust) {
    adjust = Math.abs(adjust) * 2.55;
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
  
  /*
   * Lets you modify the intensity of any combination of red, green, or blue channels.
   * Options format (must specify 1 - 3 colors):
   * {
   *  red: 20,
   *  green: -5,
   *  blue: -40
   * }
   */
  Caman.manip.channels = function (options) {
    if (typeof(options) !== 'object') {
      return;
    }
    
    for (var chan in options) {
      if (options.hasOwnProperty(chan)) {
        if (options[chan] == 0) {
          delete options[chan];
          continue;
        }
        
        options[chan] = options[chan] / 100;
      }
    }
    
    if (options.length === 0) {
      return;
    }
    
    return this.process(options, function channels(options, rgba) {
      if (options.red) {
        if (options.red > 0) {
          // fraction of the distance between current color and 255
          rgba.r = rgba.r + ((255 - rgba.r) * options.red);
        } else {
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
  
}(Caman));

}());