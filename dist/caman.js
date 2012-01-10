(function() {
  var $, Calculate, CamanInstance, Convert, Filter, Log, Logger, PixelInfo, RenderJob, Root, Store, clampRGB, extend, slice, uniqid;
  var __hasProp = Object.prototype.hasOwnProperty;

  slice = Array.prototype.slice;

  extend = function(obj) {
    var copy, dest, prop, src, _i, _len;
    dest = obj;
    src = slice.call(arguments, 1);
    for (_i = 0, _len = src.length; _i < _len; _i++) {
      copy = src[_i];
      for (prop in copy) {
        if (!__hasProp.call(copy, prop)) continue;
        dest[prop] = copy[prop];
      }
    }
    return dest;
  };

  $ = function(sel, root) {
    if (root == null) root = document;
    if (typeof sel === "object") return sel;
    return root.querySelector(sel);
  };

  uniqid = (function() {
    var id;
    id = 0;
    return {
      get: function() {
        return id++;
      }
    };
  })();

  clampRGB = function(val) {
    if (val < 0) return 0;
    if (val > 255) return 255;
    return val;
  };

  Root = typeof exports !== "undefined" && exports !== null ? exports : window;

  Root.Caman = function() {
    var tag;
    switch (arguments.length) {
      case 1:
        if (Store.has(arguments[0])) return Store.get(arguments[0]);
        return new CamanInstance(arguments, CamanInstance.Type.Image);
      case 2:
        if (Store.has(arguments[0])) {
          return Store.execute(arguments[0], arguments[1]);
        }
        if (typeof arguments[1] === 'function') {
          tag = $(arguments[0]).nodeName.toLowerCase();
          if (tag === "img") {
            return new CamanInstance(arguments, CamanInstance.Type.Image);
          }
          if (tag === "canvas") {
            return new CamanInstance(arguments, CamanInstance.Type.Canvas);
          }
        } else {
          return new CamanInstance(arguments, CamanInstance.Type.Canvas);
        }
        break;
      case 3:
        if (Store.has(arguments[0])) {
          return Store.execute(arguments[1], arguments[2]);
        }
        return new CamanInstance(arguments, CamanInstance.Type.Canvas);
    }
  };

  Caman.version = {
    release: "3.0",
    date: "1/2/12"
  };

  CamanInstance = (function() {

    CamanInstance.Type = {
      Image: 1,
      Canvas: 2
    };

    function CamanInstance(args, type) {
      if (type == null) type = CamanInstance.Type.Canvas;
      this.pixelStack = [];
      this.layerStack = [];
      this.renderQueue = [];
      switch (type) {
        case CamanInstance.Type.Image:
          this.loadImage.apply(this, args);
          break;
        case CamanInstance.Type.Canvas:
          this.loadCanvas.apply(this, args);
      }
    }

    CamanInstance.prototype.loadImage = function(id, callback) {
      var element, image, _ref;
      var _this = this;
      if (callback == null) callback = function() {};
      if (typeof id === "object" && ((_ref = id.nodeName) != null ? _ref.toLowerCase() : void 0) === "img") {
        element = id;
        if (id.id) {
          id = element.id;
        } else {
          id = "caman-" + (uniqid.get());
          element.id = id;
        }
      }
      if ($(id) != null) {
        image = $(id);
        if (image.complete) {
          return this.imageLoaded(id, image, callback);
        } else {
          return image.onload = function() {
            return _this.imageLoaded(id, image, callback);
          };
        }
      }
    };

    CamanInstance.prototype.imageLoaded = function(id, image, callback) {
      this.image = image;
      this.canvas = document.createElement('canvas');
      this.canvas.id = image.id;
      image.parentNode.replaceChild(this.canvas, this.image);
      this.canvasID = id;
      this.options = {
        canvas: id,
        image: this.image.src
      };
      return this.finishInit(callback);
    };

    CamanInstance.prototype.loadCanvas = function(url, id, callback) {
      var element, _ref;
      var _this = this;
      if (callback == null) callback = function() {};
      if (typeof id === "object" && ((_ref = id.nodeName) != null ? _ref.toLowerCase() : void 0) === "canvas") {
        element = id;
        if (id.id) {
          id = element.id;
        } else {
          id = "caman-" + (uniqid.get());
          element.id = id;
        }
      }
      if ($(id) != null) {
        return this.canvasLoaded(url, id, callback);
      } else {
        return document.addEventListener("DOMContentLoaded", function() {
          return _this.canvasLoaded(url, id, callback);
        }, false);
      }
    };

    CamanInstance.prototype.canvasLoaded = function(url, id, callback) {
      var _this = this;
      this.canvas = $(id);
      if (url != null) {
        this.image = document.createElement('img');
        this.image.onload = function() {
          return _this.finishInit(callback);
        };
        this.canvasID = id;
        this.options = {
          canvas: id,
          image: url
        };
        return this.image.src = url;
      } else {
        return this.finishInit(callback);
      }
    };

    CamanInstance.prototype.finishInit = function(callback) {
      this.context = this.canvas.getContext("2d");
      if (this.image != null) {
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        this.context.drawImage(this.image, 0, 0, this.image.width, this.image.height);
      }
      this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.pixelData = this.imageData.data;
      this.dimensions = {
        width: this.canvas.width,
        height: this.canvas.height
      };
      Store.put(this.canvasID, this);
      callback.call(this, this);
      return this;
    };

    return CamanInstance;

  })();

  Calculate = (function() {

    function Calculate() {}

    Calculate.distance = function(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    Calculate.randomRange = function(min, max, float) {
      var rand;
      if (float == null) float = false;
      rand = min + (Math.random() * (max - min));
      if (float) {
        return rand.toFixed(float);
      } else {
        return Math.round(rand);
      }
    };

    return Calculate;

  })();

  Convert = (function() {

    function Convert() {}

    Convert.hexToRGB = function(hex) {
      var b, g, r;
      if (hex.charAt(0) === "#") hex = hex.substr(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
      return {
        r: r,
        g: g,
        b: b
      };
    };

    Convert.rgbToHSL = function(r, g, b) {
      var d, h, l, max, min, s;
      r /= 255;
      g /= 255;
      b /= 255;
      max = Math.max(r, g, b);
      min = Math.min(r, g, b);
      l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = (function() {
          switch (max) {
            case r:
              return (g - b) / d + (g < b ? 6 : 0);
            case g:
              return (b - r) / d + 2;
            case b:
              return (r - g) / d + 4;
          }
        })();
        h /= 6;
      }
      return {
        h: h,
        s: s,
        l: l
      };
    };

    Convert.hslToRGB = function(h, s, l) {
      var b, g, p, q, r;
      if (s === 0) {
        r = g = b = l;
      } else {
        q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        p = 2 * l - q;
        r = this.hueToRGB(p, q, h + 1 / 3);
        g = this.hueToRGB(p, q, h);
        b = this.hueToRGB(p, q, h - 1 / 3);
      }
      return {
        r: r * 255,
        g: g * 255,
        b: b * 255
      };
    };

    Convert.hueToRGB = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    Convert.rgbToHSV = function(r, g, b) {
      var d, h, max, min, s, v;
      r /= 255;
      g /= 255;
      b /= 255;
      max = Math.max(r, g, b);
      min = Math.min(r, g, b);
      v = max;
      d = max - min;
      s = max === 0 ? 0 : d / max;
      if (max === min) {
        h = 0;
      } else {
        h = (function() {
          switch (max) {
            case r:
              return (g - b) / d + (g < b ? 6 : 0);
            case g:
              return (b - r) / d + 2;
            case b:
              return (r - g) / d + 4;
          }
        })();
        h /= 6;
      }
      return {
        h: h,
        s: s,
        v: v
      };
    };

    Convert.hsvToRGB = function(h, s, v) {
      var b, f, g, i, p, q, r, t;
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
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
      }
      return {
        r: r * 255,
        g: g * 255,
        b: b * 255
      };
    };

    Convert.rgbToXYZ = function(r, g, b) {
      var x, y, z;
      r /= 255;
      g /= 255;
      b /= 255;
      if (r > 0.04045) {
        r = Math.pow((r + 0.055) / 1.055, 2.4);
      } else {
        r /= 12.92;
      }
      if (g > 0.04045) {
        g = Math.pow((g + 0.055) / 1.055, 2.4);
      } else {
        g /= 12.92;
      }
      if (b > 0.04045) {
        b = Math.pow((b + 0.055) / 1.055, 2.4);
      } else {
        b /= 12.92;
      }
      x = r * 0.4124 + g * 0.3576 + b * 0.1805;
      y = r * 0.2126 + g * 0.7152 + b * 0.0722;
      z = r * 0.0193 + g * 0.1192 + b * 0.9505;
      return {
        x: x * 100,
        y: y * 100,
        z: z * 100
      };
    };

    Convert.xyzToRGB = function(x, y, z) {
      var b, g, r;
      x /= 100;
      y /= 100;
      z /= 100;
      r = (3.2406 * x) + (-1.5372 * y) + (-0.4986 * z);
      g = (-0.9689 * x) + (1.8758 * y) + (0.0415 * z);
      b = (0.0557 * x) + (-0.2040 * y) + (1.0570 * z);
      if (r > 0.0031308) {
        r = (1.055 * Math.pow(r, 0.4166666667)) - 0.055;
      } else {
        r *= 12.92;
      }
      if (g > 0.0031308) {
        g = (1.055 * Math.pow(g, 0.4166666667)) - 0.055;
      } else {
        g *= 12.92;
      }
      if (b > 0.0031308) {
        b = (1.055 * Math.pow(b, 0.4166666667)) - 0.055;
      } else {
        b *= 12.92;
      }
      return {
        r: r * 255,
        g: g * 255,
        b: b * 255
      };
    };

    Convert.xyzToLab = function(x, y, z) {
      var a, b, l, whiteX, whiteY, whiteZ;
      whiteX = 95.047;
      whiteY = 100.0;
      whiteZ = 108.883;
      x /= whiteX;
      y /= whiteY;
      z /= whiteZ;
      if (x > 0.008856451679) {
        x = Math.pow(x, 0.3333333333);
      } else {
        x = (7.787037037 * x) + 0.1379310345;
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
      l = 116 * y - 16;
      a = 500 * (x - y);
      b = 200 * (y - z);
      return {
        l: l,
        a: a,
        b: b
      };
    };

    Convert.labToXYZ = function(l, a, b) {
      var x, y, z;
      y = (l + 16) / 116;
      x = y + (a / 500);
      z = y - (b / 200);
      if (x > 0.2068965517) {
        x = x * x * x;
      } else {
        x = 0.1284185493 * (x - 0.1379310345);
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
      return {
        x: x * 95.047,
        y: y * 100.0,
        z: z * 108.883
      };
    };

    return Convert;

  })();

  Filter = (function() {

    function Filter() {}

    Filter.Type = {
      Single: 1,
      Kernel: 2,
      LayerDequeued: 3,
      LayerFinished: 4,
      LoadOverlay: 5,
      Plugin: 6
    };

    Filter.register = function(name, filterFunc) {
      return CamanInstance.prototype[name] = filterFunc;
    };

    Filter.prototype.render = function(callback) {
      var _this = this;
      if (callback == null) callback = function() {};
      return this.processNext(function() {
        _this.context.putImageData(_this.imageData, 0, 0);
        return callback.call(_this);
      });
    };

    Filter.prototype.process = function(name, processFn) {
      return this.renderQueue.push({
        type: Filter.Type.Single,
        name: name,
        processFn: processFn
      });
    };

    Filter.prototype.processNext = function(finishedFn) {
      var next;
      var _this = this;
      if (typeof finishedFn === "function") this.finishedFn = finishedFn;
      if (this.renderQueue.length === 0) {
        if (this.finishedFn != null) this.finishedFn.call(this);
        return;
      }
      next = this.renderQueue.shift();
      return RenderJob.execute(this, next, function() {
        return _this.processNext();
      });
    };

    return Filter;

  })();

  extend(CamanInstance.prototype, Filter.prototype);

  Filter.register("fillColor", function() {
    var color;
    if (arguments.length === 1) {
      color = Convert.hexToRGB(arguments[0]);
    } else {
      color = {
        r: arguments[0],
        g: arguments[1],
        b: arguments[2]
      };
    }
    return this.process("fillColor", function(rgba) {
      rgba.r = color.r;
      rgba.g = color.g;
      rgba.b = color.b;
      return rgba;
    });
  });

  Filter.register("brightness", function(adjust) {
    adjust = Math.floor(255 * (adjust / 100));
    return this.process("brightness", function(rgba) {
      rgba.r += adjust;
      rgba.g += adjust;
      rgba.b += adjust;
      return rgba;
    });
  });

  Filter.register("saturation", function(adjust) {
    adjust *= -0.01;
    return this.process("saturation", function(rgba) {
      var max;
      max = Math.max(rgba.r, rgba.g, rgba.b);
      if (rgba.r !== max) rgba.r += (max - rgba.r) * adjust;
      if (rgba.g !== max) rgba.g += (max - rgba.g) * adjust;
      if (rgba.b !== max) rgba.b += (max - rgba.b) * adjust;
      return rgba;
    });
  });

  Filter.register("vibrance", function(adjust) {
    adjust *= -1;
    return this.process("vibrance", function(rgba) {
      var amt, avg, max;
      max = Math.max(rgba.r, rgba.g, rgba.b);
      avg = (rgba.r + rgba.g + rgba.b) / 3;
      amt = ((Math.abs(max - avg) * 2 / 255) * adjust) / 100;
      if (rgba.r !== max) rgba.r += (max - rgba.r) * adjust;
      if (rgba.g !== max) rgba.g += (max - rgba.g) * adjust;
      if (rgba.b !== max) rgba.b += (max - rgba.b) * adjust;
      return rgba;
    });
  });

  Filter.register("greyscale", function(adjust) {
    return this.process("greyscale", function(rgba) {
      var avg;
      avg = 0.3 * rgba.r + 0.59 * rgba.g + 0.11 * rgba.b;
      rgba.r = avg;
      rgba.g = avg;
      rgba.b = avg;
      return rgba;
    });
  });

  Filter.register("contrast", function(adjust) {
    adjust = Math.pow((adjust + 100) / 100, 2);
    return this.process("contrast", function(rgba) {
      rgba.r /= 255;
      rgba.r -= 0.5;
      rgba.r *= adjust;
      rgba.r += 0.5;
      rgba.r *= 255;
      rgba.g /= 255;
      rgba.g -= 0.5;
      rgba.g *= adjust;
      rgba.g += 0.5;
      rgba.g *= 255;
      rgba.b /= 255;
      rgba.b -= 0.5;
      rgba.b *= adjust;
      rgba.b += 0.5;
      rgba.b *= 255;
      return rgba;
    });
  });

  Filter.register("hue", function(adjust) {
    return this.process("hue", function(rgba) {
      var h, hsv, rgb;
      hsv = Convert.rgbToHSV(rgba.r, rgba.g, rgba.b);
      h = hsv.h * 100;
      h += Math.abs(adjust);
      h = h % 100;
      h /= 100;
      hsv.h = h;
      rgb = Convert.hsvToRGB(hsv.h, hsv.s, hsv.v);
      rgb.a = rgba.a;
      return rgb;
    });
  });

  Filter.register("colorize", function() {
    var level, rgb;
    if (arguments.length === 2) {
      rgb = Convert.hexToRGB(arguments[0]);
      level = arguments[1];
    } else if (arguments.length === 4) {
      rgb = {
        r: arguments[0],
        g: arguments[1],
        b: arguments[2]
      };
      level = arguments[3];
    }
    return this.process("colorize", function(rgba) {
      rgba.r -= (rgba.r - rgb.r) * (level / 100);
      rgba.g -= (rgba.g - rgb.g) * (level / 100);
      rgba.b -= (rgba.b - rgb.b) * (level / 100);
      return rgba;
    });
  });

  Filter.register("invert", function() {
    return this.process("invert", function(rgba) {
      rgba.r = 255 - rgba.r;
      rgba.g = 255 - rgba.g;
      rgba.b = 255 - rgba.b;
      return rgba;
    });
  });

  Filter.register("sepia", function(adjust) {
    if (adjust == null) adjust = 100;
    adjust /= 100;
    return this.process("sepia", function(rgba) {
      rgba.r = Math.min(255, (rgba.r * (1 - (0.607 * adjust))) + (rgba.g * (0.769 * adjust)) + (rgba.b * (0.189 * adjust)));
      rgba.g = Math.min(255, (rgba.r * (0.349 * adjust)) + (rgba.g * (1 - (0.314 * adjust))) + (rgba.b * (0.168 * adjust)));
      rgba.b = Math.min(255, (rgba.r * (0.272 * adjust)) + (rgba.g * (0.534 * adjust)) + (rgba.b * (1 - (0.869 * adjust))));
      return rgba;
    });
  });

  Filter.register("gamma", function(adjust) {
    return this.process("gamma", function(rgba) {
      rgba.r = Math.pow(rgba.r / 255, adjust) * 255;
      rgba.g = Math.pow(rgba.g / 255, adjust) * 255;
      rgba.b = Math.pow(rgba.b / 255, adjust) * 255;
      return rgba;
    });
  });

  Filter.register("noise", function(adjust) {
    adjust = Math.abs(adjust) * 2.55;
    return this.process("noise", function(rgba) {
      var rand;
      rand = Calculate.randomRange(adjust * -1, adjust);
      rgba.r += rand;
      rgba.g += rand;
      rgba.b += rand;
      return rgba;
    });
  });

  Logger = (function() {

    function Logger() {
      var name, _i, _len, _ref;
      _ref = ['log', 'info', 'warn', 'error'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        this[name] = (function(name) {
          return function() {
            if (window.console != null) {
              return window.console[name].apply(console, arguments);
            }
          };
        })(name);
      }
      this.debug = this.log;
    }

    return Logger;

  })();

  Log = new Logger();

  PixelInfo = (function() {

    function PixelInfo(c) {
      this.c = c;
      this.loc = 0;
    }

    PixelInfo.prototype.locationXY = function() {
      var x, y;
      y = this.dimensions.height - Math.floor(this.loc / (this.dimensions.width * 4));
      x = (this.loc % (this.dimensions.width * 4)) / 4;
      return {
        x: x,
        y: y
      };
    };

    return PixelInfo;

  })();

  RenderJob = (function() {

    RenderJob.Blocks = 4;

    RenderJob.execute = function(instance, job, callback) {
      var rj;
      rj = new RenderJob(instance, job, callback);
      switch (job.type) {
        case Filter.Type.Single:
          return rj.executeFilter();
      }
    };

    function RenderJob(c, job, renderDone) {
      this.c = c;
      this.job = job;
      this.renderDone = renderDone;
    }

    RenderJob.prototype.executeFilter = function() {
      var blockN, blockPixelLength, end, j, lastBlockN, n, start, _ref, _results;
      var _this = this;
      this.blocksDone = 0;
      n = this.c.pixelData.length;
      blockPixelLength = Math.floor((n / 4) / RenderJob.Blocks);
      blockN = blockPixelLength * 4;
      lastBlockN = blockN + ((n / 4) % RenderJob.Blocks) * 4;
      if (this.job.type === Filter.Type.Single) {
        _results = [];
        for (j = 0, _ref = RenderJob.Blocks; 0 <= _ref ? j < _ref : j > _ref; 0 <= _ref ? j++ : j--) {
          start = j * blockN;
          end = start + (j === RenderJob.Blocks - 1 ? lastBlockN : blockN);
          _results.push(setTimeout((function(j, start, end) {
            return function() {
              return _this.renderBlock(j, start, end);
            };
          })(j, start, end), 0));
        }
        return _results;
      }
    };

    RenderJob.prototype.renderBlock = function(bnum, start, end) {
      var data, i, pixelInfo, res;
      Log.debug("BLOCK #" + bnum + " - Filter: " + this.job.name + ", Start: " + start + ", End: " + end);
      data = {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      };
      pixelInfo = new PixelInfo(this.c);
      for (i = start; i < end; i += 4) {
        pixelInfo.loc = i;
        data.r = this.c.pixelData[i];
        data.g = this.c.pixelData[i + 1];
        data.b = this.c.pixelData[i + 2];
        res = this.job.processFn.call(pixelInfo, data);
        this.c.pixelData[i] = clampRGB(res.r);
        this.c.pixelData[i + 1] = clampRGB(res.g);
        this.c.pixelData[i + 2] = clampRGB(res.b);
      }
      return this.blockFinished(bnum);
    };

    RenderJob.prototype.blockFinished = function(bnum) {
      if (bnum >= 0) {
        Log.debug("Block #" + bnum + " finished! Filter: " + this.job.name);
      }
      this.blocksDone++;
      if (this.blocksDone === RenderJob.Blocks || bnum === -1) {
        if (bnum >= 0) Log.debug("Filter " + this.job.name + " finished!");
        if (bnum < 0) Log.debug("Kernel filter " + this.job.name + " finished!");
        return this.renderDone();
      }
    };

    return RenderJob;

  })();

  Store = (function() {

    function Store() {}

    Store.items = {};

    Store.has = function(search) {
      return this.items[search] != null;
    };

    Store.get = function(search) {
      return this.items[search];
    };

    Store.put = function(name, obj) {
      return this.items[name] = obj;
    };

    Store.execute = function(search, callback) {
      return callback.call(this.get(search), this.get(search));
    };

    return Store;

  })();

}).call(this);
