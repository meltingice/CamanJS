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