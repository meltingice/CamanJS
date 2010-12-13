(function(global) {

  var Caman = (function(global) {
    
    var  Caman, 
    forEach = Array.prototype.forEach, 
    hasOwn = Object.prototype.hasOwnProperty, 
    slice = Array.prototype.slice;
  
    /*
     * CamanJS can accept arguments in 2 different formats:
     * 
     * Format 1:
     *    Caman('path/to/image.jpg', '#canvas-id', function () {})
     *
     * Format 2:
     *    Caman({
     *      src: 'path/to/image.jpg',
     *      canvas: '#canvas-id',
     *      ready: function () {}
     *    });
     */
    Caman = function( options ) {
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
    
    Caman.ready = false;
    Caman.store = {};
        
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
            this.orig_pixel_data = this.image_data.data;
            this.dimensions = {
              width: img.width, 
              height: img.height
            };
            
            this.worker = Caman.worker();
            this.inProcess  = false;
            this.queueItems = [];
            this.queue = {};
            
            options.ready && options.ready.call(this, this);            
          
            Caman.store[canvas_id] = this;

            return this;
            
          }, that = this;
        
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
      
      finished: function (callback) {
        var that = this;
        Caman.listen("queueFinished", function (data) {
          if (data.id === that.canvas_id) {
            callback.call(that);
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
    
    /*
     * Some important additional functions that are included
     * by default with the core library.
     */
    Caman.extend( Caman, {
      
      /*
       * Generates a unique ID based on the current time
       */
      guid: function() {
        return +new Date();
      },
      
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
      
      /*
       * Data memoization - used to reduce the amount of processing
       * needed by storing already found values in an object.
       *
       * If the value has already been stored, it is returned. Otherwise,
       * this function will return false.
       */
      getMemo: function (key, d1, d2, d3) {
        /*
         * So it turns out that memoization is actually slowing down CamanJS and
         * is likely the cause behind the memory errors in Firefox 3. Instead of
         * completely removing this code, lets just return immediately in case
         * the memoization can be improved in the future.
         */
        return false;
        
        var index = String(d1) + String(d2) + String(d3);
        
        if (!this.memos || !this.memos[key]) {
          return false;
        }
        
        if (this.memos[key][index]) {
          return this.memos[key][index];
        }
        
        return false;
      },
      
      /*
       * Data memoization - this function will store the given calculated
       * value for future use if needed.
       */
      setMemo: function (key, d1, d2, d3, value) {
        /*
         * Memoziation is disabled for now, see getMemo() above.
         */
        return value;
        
        var index = String(d1) + String(d2) + String(d3);
        
        if (!this.memos) {
          this.memos = {};
        }
        
        if (!this.memos[key]) {
          this.memos[key] = {};
        }
        
        this.memos[key][index] = value;
        
        return value;
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
        var value, result;
        if (value = this.getMemo('rgbhsl', r, g, b)) {
          return value;
        }
        
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
        
        return this.setMemo('rgbhsl', r, g, b, {h: h, s: s, l: l});
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
          var r, g, b, value;
          
          if (value = this.getMemo('hslrgb', h, s, l)) {
            return value;
          }
      
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
          
          return this.setMemo('hslrgb', h, s, l, {r: r * 255, g: g * 255, b: b * 255});
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
          var value;
          
          if (value = this.getMemo('rgbhsv', r, g, b)) {
            return value;
          }
          
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
      
          return this.setMemo('rgbhsv', r, g, b, {h: h, s: s, v: v});
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
          var value;
          
          if (value = this.getMemo('hsvrgb', h, s, v)) {
            return value;
          }
        
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
      
          return this.setMemo('hsvrgb', h, s, v, {r: r * 255, g: g * 255, b: b * 255});
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
        var value;

        if (value = Caman.getMemo('rgbxyz', r, g, b)) {
          return value;
        }

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

        return Caman.setMemo('rgbxyz', r, g, b, {x: x * 100, y: y * 100, z: z * 100});
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
        var value;

        if (value = Caman.getMemo('xyzrgb', x, y, z)) {
          return value;
        }
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

        return Caman.setMemo('xyzrgb', x, y, z, {r: r * 255, g: g * 255, b: b * 255});
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
        var value;

        if (value = Caman.getMemo('xyzlab', x, y, z)) {
          return value;
        }

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

        return Caman.setMemo('xyzlab', x, y, z, {l: l, a: a, b: b});
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
        var value;

        if (value = Caman.getMemo('labxyz', l, a, b)) {
          return value;
        }

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
        return Caman.setMemo('labxyz', l, a, b, {x: x * 95.047, y: y * 100.0, z: z * 108.883});
      },

      /*
       * Converts the hex representation of a color to RGB values.
       * Hex value can optionally start with the hash (#).
       *
       * @param   String  hex   The colors hex value
       * @return  Array         The RGB representation
       */
      hex_to_rgb: function(hex) {
        var r, g, b, value;
        
        if (value = this.getMemo('hexrgb', hex, "", "")) {
          return value;
        }
        
        if (hex.charAt(0) === "#") {
          hex = hex.substr(1);
        }
        
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
        
        return this.setMemo('hexrgb', hex, "", "", {r: r, g: g, b: b});
      }
    });
    
    /*
     * CamanJS event system
     * Events can be subscribed to using Caman.listen() and events
     * can be triggered using Caman.trigger().
     */
    Caman.events  = {
      types: [ "processStart", "processComplete", "queueFinished" ],
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
            Caman.events.fn[_type] = {};
          }
          
          Caman.events.fn[_type][ _fn.toString() ] = _fn;
          
          return true;
        }
      },
      cache: {} /*{
        // [type] = { fn.toString() : fn }
        //  types: processStart, processComplete
      }*/
    };
    
    Caman.manip.process = function( adjust, processFn ) {
      var self = this, dims = self.dimensions;
      

      self.queueItems.push(processFn.name);
      
      if ( !self.queue[processFn.name] ) {
        self.queue[processFn.name]  = {};
      }
      
      self.queue[processFn.name].adjust = adjust;
      self.queue[processFn.name].process = processFn;
      self.queue[processFn.name].fn =  (function (processFnName) {
      
        return function(event) {
          
          var data = event.data, len;
          
          if ( !data.pixelData ) {
            return;
          }          
          
          if ( !!self.queue[processFnName] && ( data.processFnName === processFnName ) ) {
        
            Caman.trigger( "processStart", {
              id: self.canvas_id, 
              completed: data.processFnName
            });
            
            delete self.queue[processFnName];

            len = self.image_data.data.length;
            
            function commit() {
              for ( ; len >= 0; len-- ) {
                // update with the new data. worker can't do this with CanvasPixelArray
                if ( self.image_data.data[len] !== data.pixelData[len] ) {
                  // Only update the value has actually changed
                  self.image_data.data[len] = self.pixel_data[len] = data.pixelData[len];
                }
              }
              
              self.context.putImageData(  self.image_data, 0, 0);
              
              self.queueItems = Caman.remove( self.queueItems, data.processFnName );
        
              if ( self.queueItems.length ) {
                var next = self.queueItems[0];
                
                self.worker.postMessage({
                  "pixelData" : self.image_data.data,
                  "processFn" : self.queue[next].process.toString(),
                  "processFnName" : self.queue[next].process.name,
                  "adjust": self.queue[next].adjust
                });
              } else {
                Caman.trigger( "queueFinished", {id: self.canvas_id} );
              }
                            
              self.inProcess = false;
              Caman.trigger( "processComplete", { id: self.canvas_id, completed: data.processFnName } );              
            }
            
            commit();
        
          }
        
          return self;
      };          
    }(processFn.name));

      this.worker.addEventListener( "message", self.queue[processFn.name].fn, false);

      if ( !this.inProcess ) {
        
        this.inProcess = true;

        this.worker.postMessage({
          "pixelData" : self.image_data.data,
          "processFn" : processFn.toString(),
          "processFnName" : processFn.name,
          "adjust": adjust
        });
      }
        

      return this; 
    };
    
    Caman.getMyself = function () {
      var name = /(^|[\/\\])caman\.js(\?|$)/,
          scripts = document.getElementsByTagName("script"),
          src;
          
      for (var i = 0; i < scripts.length; i++) {
        if (src = scripts[i].getAttribute('src')) {
          if (src.match(name)) {
            return src;
          }
        }
      }
    }
    
    Caman.worker  = function() {
      
      var worker = new Worker( Caman.getMyself() );
      
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
    "processFnName": data.processFnName, 
    "pixelData" : data.pixelData
  });
};
// WorkerGlobalScope //

// Basic event system
(function (Caman) {
  
  Caman.forEach( ["trigger", "listen"], function ( key ) {
    Caman[key] = Caman.events.fn[key];
  });  
  
})(Caman);

// Basic library of effects/filters that is always loaded
(function(Caman) {

  Caman.manip.brightness = function(adjust) {
    
    adjust = Math.floor(255 * (adjust / 100));
    
    // Note that process has 2 args now
    return this.process( adjust,  function brightness(adjust, rgba) {
              // also pass the adjustment to the process callback
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
    var hsv, h;      
    return this.process( adjust, function hue(adjust, rgba) {
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
    
    return this.process( [ level, rgb ],  function colorize( adjust, rgba) {
    
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
  }
  
}(Caman));
