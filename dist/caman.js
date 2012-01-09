(function() {
  var $, CamanInstance, Root, Store, uniqid;

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
