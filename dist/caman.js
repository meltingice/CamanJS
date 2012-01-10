(function() {
  var $, CamanInstance, Filter, Log, Logger, PixelInfo, RenderJob, Root, Store, clampRGB, extend, slice, uniqid;
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

  Filter.register("brightness", function(adjust) {
    adjust = Math.floor(255 * (adjust / 100));
    return this.process("brightness", function(rgba) {
      rgba.r += adjust;
      rgba.g += adjust;
      rgba.b += adjust;
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
      if (bnum >= 0) Log.debug("Block #" + bnum + " finished! Filter: " + name);
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
