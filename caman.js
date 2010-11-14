(function(global) {

  var Caman = (function(global) {
    
    var forEach = Array.prototype.forEach, 
        hasOwn  = Object.prototype.hasOwnProperty, 
        slice = Array.prototype.slice, 
  
    Caman = function(options) {
      if (typeof options === "string") {
        var temp = options;
        
        options = {
          src: temp,
          canvas: arguments[1] || "",
          ready: arguments[2] || function() {}
        };
      }
      
      return new Caman.manip.load(options);
    };
    
    Caman.manip = Caman.prototype = {
      load: function(options) {
        var img = document.createElement("img"),
          imageReady = function() {
            var canvas_id = options.canvas,
              canvas;
            
            if (canvas_id.substr(0, 1) === "#") {
              canvas = document.getElementById(canvas_id.substr(1));
              if (!canvas) {
                return;
              }  
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            this.worker = Caman.worker();
            this.context = canvas.getContext("2d");
            this.context.drawImage(img, 0, 0);
            this.image_data = this.context.getImageData(0, 0, img.width, img.height);
            this.pixel_data = this.image_data.data;
            this.dimensions = {
              width: img.width, 
              height: img.height
            };
            
            options.ready && options.ready.call(this);
            
          }, that = this;
        
        document.addEventListener("DOMContentLoaded", function() {
          img.src = options.src;
          img.onload = function() {
              imageReady.call(that);  
          };
        }, false);
        
        return this;
      }
    };

    Caman.manip.load.prototype = Caman.manip;

    Caman.forEach = function( obj, fn, context ) {

      // Use native whenever possible
      if ( forEach ) {
        return obj.forEach(fn, context);
      } 

      for ( var key in obj ) {
        if ( hasOwn.call(obj, key) ) {
          fn.call(context, obj[key], key, obj);
        } 
      }        

      return obj;
    };
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
      guid: function() {
        return +new Date();
      }, 
      same: function ( base, test ) {
        
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
      rgb_to_hsl: function(r, g, b) {
          r /= 255, g /= 255, b /= 255;
          var max = Math.max(r, g, b), min = Math.min(r, g, b);
          var h, s, l = (max + min) / 2;
      
          if(max == min){
              h = s = 0; // achromatic
          }else{
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
      
          return {r: r * 255, g: g * 255, b: b * 255};
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
          var max = Math.max(r, g, b), min = Math.min(r, g, b);
          var h, s, v = max;
      
          var d = max - min;
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
      
          return {h: h, s: s, v: v};
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
          var r, g, b;
      
          var i = Math.floor(h * 6);
          var f = h * 6 - i;
          var p = v * (1 - s);
          var q = v * (1 - f * s);
          var t = v * (1 - (1 - f) * s);
      
          switch(i % 6){
              case 0: r = v, g = t, b = p; break;
              case 1: r = q, g = v, b = p; break;
              case 2: r = p, g = v, b = t; break;
              case 3: r = p, g = q, b = v; break;
              case 4: r = t, g = p, b = v; break;
              case 5: r = v, g = p, b = q; break;
          }
      
          return {r: r * 255, g: g * 255, b: b * 255};
      },
      
      hex_to_rgb: function(hex) {
        var r, g, b;
        
        if (hex.charAt(0) === "#") {
          hex = hex.substr(1);
        }
        
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
        
        return {r: r, g: g, b: b};
      }      
    });
    


    
    Caman.manip.process = function( adjust, processFn ) {
      var complete = false, self = this, dims = self.dimensions;

      this.worker.addEventListener( "DOMContentLoaded", function(event) {
        var data = event.data, len;
        
        if ( !data.pixelData ) {
          return;
        }
        
        len = self.image_data.data.length;
        
        for ( ; len >=0; len-- ) {
          // update with the new data. worker can't do this with CanvasPixelArray
          if ( self.image_data.data[len] !== data.pixelData[len] ) {
            // Only update the value has actually changed
            self.image_data.data[len] = data.pixelData[len];
          }
        }
        
        self.context.putImageData(  self.image_data, 0, 0);
        
        complete = true;
      
      }, false);
      
      //  Send message to worker to begin processing
      this.worker.postMessage({
        "pixelData" : self.context.getImageData(0, 0, dims.width, dims.height).data, 
        "processFn" : processFn.toString(),
        "adjust": adjust
      });        

      return this; 
    };
    
    Caman.worker  = function() {
      
      // need a solution to avoid 404 // global.location.pathname + 
      var worker = new Worker( "../caman.js");
      
      worker.guid = Caman.guid();

      return worker;
    };
    
    return (global.Caman = Caman);
    
  })(global);
})(this);


// WorkerGlobalScope //
// We can attach this to a global scope Use onmessage; 
onmessage = function( event ) {
  var data = event.data, 
      processFn = new Function("return " + data.processFn)();
      n = data.pixelData.length;

  for ( var i = 0; i < n; i += 4) {
      res = processFn.call(null, data.adjust, {
        r: data.pixelData[i], 
        g: data.pixelData[i+1], 
        b: data.pixelData[i+2], 
        a: data.pixelData[i+3]
      });

      data.pixelData[i]   = res.r;
      data.pixelData[i+1] = res.g;
      data.pixelData[i+2] = res.b;
      data.pixelData[i+3] = res.a;
  }  
  // TODO: add rest of data object
  postMessage({
    "data" : data, 
    "pixelData" : data.pixelData
  });
};
// WorkerGlobalScope //

// Basic library of effects/filters that is always loaded
(function(Caman) {

  Caman.manip.brightness = function(adjust) {
    
    adjust = Math.floor(255 * (adjust / 100));
    
    // Note that process has 2 args now
    return this.process( adjust,  function (adjust, rgba) {
              // also pass the adjustment to the process callback
              rgba.r += adjust;
              rgba.g += adjust;
              rgba.b += adjust;

              return rgba;
            });
  };
  
  
  
  //  TODO: update the rest of the filter functions

  Caman.manip.saturation = function(adjust) {
    adjust *= -1;
    
    return this.process( adjust,  function (adjust, rgba) {
                var chan, max, diff;
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
  
  Caman.manip.contrast = function(adjust) {

    adjust = Math.pow((100 + adjust) / 100, 2);
    
    return this.process( adjust,  function (adjust, rgba) {  
        
              for ( var chan in rgba) {
                if (rgba.hasOwnProperty(chan)) {
                  rgba[chan] /= 255;
                  rgba[chan] -= 0.5;
                  rgba[chan] *= adjust;
                  rgba[chan] += 0.5;
                  rgba[chan] *= 255;
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
    var hsv, rgb, h;
            
    return this.process( adjust,  function (adjust, rgba) {
        hsv = Caman.rgb_to_hsv(rgba.r, rgba.g, rgba.b);
        h = hsv.h * 100;
        h += Math.abs(adjust);
        h = h % 100;
        h /= 100;
        hsv.h = h;
        
        rgb = Caman.hsv_to_rgb(hsv.h, hsv.s, hsv.v);
        
        return {r: rgb.r, g: rgb.g, b: rgb.b, a: rgba.a};
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
      }
      level = arguments[3];
    }
    
    return this.process( [ level, rgb ],  function ( adjust, rgba) {
    
        rgba.r -= (rgba.r - adjust[1].r) * (adjust[0] / 100);
        rgba.g -= (rgba.g - adjust[1].g) * (adjust[0] / 100);
        rgba.b -= (rgba.b - adjust[1].b) * (adjust[0] / 100);
        
        return rgba;
    });
  };
  
}(Caman));
