(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Caman"] = factory();
	else
		root["Caman"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _context = __webpack_require__(1);
	
	var _context2 = _interopRequireDefault(_context);
	
	var _filter = __webpack_require__(4);
	
	var _filter2 = _interopRequireDefault(_filter);
	
	var _renderer = __webpack_require__(2);
	
	var _renderer2 = _interopRequireDefault(_renderer);
	
	var _camanLib = __webpack_require__(5);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Caman = function () {
	  _createClass(Caman, null, [{
	    key: 'blank',
	    value: function blank(size) {
	      return new Promise(function (resolve, reject) {
	        var canvas = document.createElement('canvas');
	        canvas.width = size.width;
	        canvas.height = size.height;
	
	        return resolve(new Caman(canvas));
	      });
	    }
	  }, {
	    key: 'fromURL',
	    value: function fromURL(url) {
	      return new Promise(function (resolve, reject) {
	        var image = document.createElement('img');
	        image.addEventListener('load', function () {
	          resolve(Caman.fromImage(image));
	        });
	        image.src = url;
	      });
	    }
	  }, {
	    key: 'fromImage',
	    value: function fromImage(image) {
	      var loadImage = new Promise(function (resolve, reject) {
	        if (image.complete || image.naturalWidth && image.naturalWidth > 0) {
	          return resolve(image);
	        } else {
	          image.addEventListener('load', function () {
	            resolve(image);
	          });
	        }
	      });
	
	      return new Promise(function (resolve, reject) {
	        loadImage.then(function (image) {
	          var canvas = document.createElement('canvas');
	          canvas.width = image.width;
	          canvas.height = image.height;
	
	          var context = canvas.getContext('2d');
	          context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
	
	          return resolve(new Caman(canvas));
	        });
	      });
	    }
	  }, {
	    key: 'fromCanvas',
	    value: function fromCanvas(canvas) {
	      return new Promise(function (resolve, reject) {
	        return resolve(new Caman(canvas));
	      });
	    }
	  }]);
	
	  function Caman(canvas) {
	    _classCallCheck(this, Caman);
	
	    this.context = new _context2.default(canvas);
	    this.canvas = canvas;
	    this.contexts = [];
	  }
	
	  _createClass(Caman, [{
	    key: 'attach',
	    value: function attach(dest) {
	      dest = (typeof dest === 'undefined' ? 'undefined' : _typeof(dest)) === "object" ? dest : document.querySelector(dest);
	      dest.parentNode.replaceChild(this.canvas, dest);
	    }
	  }, {
	    key: 'pipeline',
	    value: function pipeline(func) {
	      func.call(this.context.renderer);
	      return this.render();
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return this.context.renderer.render();
	    }
	  }]);
	
	  return Caman;
	}();
	
	Caman.Filter = _filter2.default;
	
	Caman.Renderer = _renderer2.default;
	
	(0, _camanLib.CamanLib)(Caman);
	
	exports.default = Caman;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _renderer = __webpack_require__(2);
	
	var _renderer2 = _interopRequireDefault(_renderer);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Context = function () {
	  function Context(canvas) {
	    _classCallCheck(this, Context);
	
	    this.canvas = canvas;
	    this.context = this.canvas.getContext('2d');
	    this.width = this.canvas.width;
	    this.height = this.canvas.height;
	    this.load();
	
	    this.renderer = new _renderer2.default(this);
	  }
	
	  _createClass(Context, [{
	    key: "load",
	    value: function load() {
	      this.imageData = this.context.getImageData(0, 0, this.width, this.height);
	      this.pixelData = this.imageData.data;
	    }
	  }, {
	    key: "update",
	    value: function update() {
	      this.context.putImageData(this.imageData, 0, 0);
	    }
	  }]);
	
	  return Context;
	}();
	
	exports.default = Context;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _render_worker = __webpack_require__(3);
	
	var _render_worker2 = _interopRequireDefault(_render_worker);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Renderer = function () {
	  _createClass(Renderer, null, [{
	    key: "register",
	    value: function register(processName, processFunc) {
	      this.prototype[processName] = function () {
	        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	          args[_key] = arguments[_key];
	        }
	
	        this.enqueue(processName, processFunc.apply(this, args));
	        return this;
	      };
	    }
	  }, {
	    key: "registerAlias",
	    value: function registerAlias(processName, processFunc) {
	      this.prototype[processName] = function () {
	        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	          args[_key2] = arguments[_key2];
	        }
	
	        processFunc.apply(this, args);
	      };
	    }
	  }, {
	    key: "Blocks",
	    get: function get() {
	      return 1;
	    }
	  }]);
	
	  function Renderer(context) {
	    _classCallCheck(this, Renderer);
	
	    this.context = context;
	    this.renderQueue = [];
	    this.pixelData = this.context.pixelData;
	    this.workers = [];
	
	    this.createWorkers();
	  }
	
	  _createClass(Renderer, [{
	    key: "createWorkers",
	    value: function createWorkers() {
	      var n = this.pixelData.length;
	      var blockPixelLength = Math.floor(n / 4 / Renderer.Blocks);
	      var blockN = blockPixelLength * 4;
	      var lastBlockN = blockN + n / 4 % Renderer.Blocks * 4;
	      var start = void 0,
	          end = void 0;
	
	      for (var i = 0; i < Renderer.Blocks; i++) {
	        start = i * blockN;
	        end = start + (i == Renderer.Blocks - 1 ? lastBlockN : blockN);
	
	        this.workers.push(new _render_worker2.default(this.context, i, start, end));
	      }
	    }
	  }, {
	    key: "enqueue",
	    value: function enqueue(name, item) {
	      this.renderQueue.push({ name: name, item: item });
	    }
	  }, {
	    key: "render",
	    value: function render() {
	      var _this = this;
	
	      return new Promise(function (resolve, reject) {
	        setTimeout(function () {
	          while (_this.renderQueue.length > 0) {
	            _this.processNext();
	          }
	
	          _this.context.update();
	          resolve();
	        }, 0);
	      });
	    }
	  }, {
	    key: "processNext",
	    value: function processNext() {
	      var job = this.renderQueue.shift();
	      job.item.setContext(this.context);
	
	      console.log("Processing:", job.name);
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;
	
	      try {
	        for (var _iterator = this.workers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var worker = _step.value;
	
	          worker.process(job);
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }
	    }
	  }]);
	
	  return Renderer;
	}();
	
	exports.default = Renderer;

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var RenderWorker = function () {
	  function RenderWorker(context, id, start, end) {
	    _classCallCheck(this, RenderWorker);
	
	    this.context = context;
	    this.id = id;
	    this.start = start;
	    this.end = end;
	    this.pixelData = this.context.pixelData;
	  }
	
	  _createClass(RenderWorker, [{
	    key: "process",
	    value: function process(job) {
	      var processor = job.item;
	      processor.setup();
	
	      for (var i = this.start; i < this.end; i += 4) {
	        processor.setPixel(i, this.pixelData[i], this.pixelData[i + 1], this.pixelData[i + 2], this.pixelData[i + 3]);
	
	        processor.execute();
	      }
	
	      processor.finish();
	    }
	  }]);
	
	  return RenderWorker;
	}();
	
	exports.default = RenderWorker;

/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Filter = function () {
	  function Filter(processFunc) {
	    _classCallCheck(this, Filter);
	
	    this.processFunc = processFunc;
	    this.context = null;
	    this.pixelData = null;
	    this.loc = 0;
	    this.r = this.g = this.b = 0;
	    this.a = 255;
	  }
	
	  _createClass(Filter, [{
	    key: "setContext",
	    value: function setContext(context) {
	      this.context = context;
	      this.pixelData = context.pixelData;
	      this.width = context.width;
	      this.height = context.height;
	    }
	  }, {
	    key: "setPixel",
	    value: function setPixel(loc, r, g, b, a) {
	      this.loc = loc;
	      this.r = r;
	      this.g = g;
	      this.b = b;
	      this.a = a;
	    }
	  }, {
	    key: "setup",
	    value: function setup() {/* noop */}
	  }, {
	    key: "execute",
	    value: function execute() {
	      this.processFunc.call(this);
	
	      this.pixelData[this.loc] = this.r;
	      this.pixelData[this.loc + 1] = this.g;
	      this.pixelData[this.loc + 2] = this.b;
	      this.pixelData[this.loc + 3] = this.a;
	    }
	  }, {
	    key: "finish",
	    value: function finish() {/* noop */}
	  }, {
	    key: "coordinatesToLocation",
	    value: function coordinatesToLocation(x, y) {
	      return (y * this.width + x) * 4;
	    }
	  }, {
	    key: "locationToCoordinates",
	    value: function locationToCoordinates(loc) {
	      var y = Math.floor(loc / (this.width * 4));
	      var x = loc % (this.width * 4) / 4;
	
	      return [x, y];
	    }
	  }, {
	    key: "locationXY",
	    value: function locationXY() {
	      var y = Math.floor(this.loc / (this.width * 4));
	      var x = this.loc % (this.width * 4) / 4;
	
	      return [x, y];
	    }
	  }, {
	    key: "pixelAtLocation",
	    value: function pixelAtLocation(loc) {
	      return [this.pixelData[this.loc], this.pixelData[this.loc + 1], this.pixelData[this.loc + 2], this.pixelData[this.loc + 3]];
	    }
	  }, {
	    key: "getPixelRelative",
	    value: function getPixelRelative(horiz, vert) {
	      var newLoc = this.loc + this.width * 4 * vert + 4 * horiz;
	
	      if (newLoc > this.pixelData.length || newLoc < 0) {
	        return [0, 0, 0, 255];
	      } else {
	        return this.pixelAtLocation(newLoc);
	      }
	    }
	  }, {
	    key: "putPixelRelative",
	    value: function putPixelRelative(horiz, vert, rgba) {
	      var newLoc = this.loc + this.width * 4 * vert + 4 * horiz;
	
	      if (newLoc < this.pixelData.length || newLoc < 0) return false;
	
	      this.pixelData[newLoc] = rgba.r;
	      this.pixelData[newLoc + 1] = rgba.g;
	      this.pixelData[newLoc + 2] = rgba.b;
	      this.pixelData[newLoc + 3] = rgba.a;
	
	      return true;
	    }
	  }, {
	    key: "getPixel",
	    value: function getPixel(x, y) {
	      var loc = this.coordinatesToLocation(x, y);
	      return this.pixelAtLocation(loc);
	    }
	  }, {
	    key: "putPixel",
	    value: function putPixel(x, y, rgba) {
	      var loc = this.coordinatesToLocation(x, y);
	
	      this.pixelData[this.loc] = rgba.r;
	      this.pixelData[this.loc + 1] = rgba.g;
	      this.pixelData[this.loc + 2] = rgba.b;
	      this.pixelData[this.loc + 3] = rgba.a;
	    }
	  }]);
	
	  return Filter;
	}();
	
	exports.default = Filter;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.CamanLib = CamanLib;
	
	var _filters = __webpack_require__(6);
	
	var _convolution = __webpack_require__(9);
	
	function CamanLib(Caman) {
	  (0, _filters.Filters)(Caman);
	  (0, _convolution.Convolution)(Caman);
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Filters = Filters;
	
	var _calculate = __webpack_require__(7);
	
	var _calculate2 = _interopRequireDefault(_calculate);
	
	var _color = __webpack_require__(8);
	
	var _color2 = _interopRequireDefault(_color);
	
	var _filter = __webpack_require__(4);
	
	var _filter2 = _interopRequireDefault(_filter);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function Filters(Caman) {
	  Caman.Renderer.register("brightness", function (adjust) {
	    adjust = Math.floor(255 * (adjust / 100));
	
	    return new _filter2.default(function () {
	      this.r += adjust;
	      this.g += adjust;
	      this.b += adjust;
	    });
	  });
	
	  Caman.Renderer.register("fillColor", function () {
	    var color = void 0;
	
	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }
	
	    if (args.length === 1) {
	      color = _color2.default.hexToRGB(args[0]);
	    } else {
	      color = args;
	    }
	
	    return new _filter2.default(function () {
	      this.r = color[0];
	      this.g = color[1];
	      this.b = color[2];
	      this.a = 255;
	    });
	  });
	
	  Caman.Renderer.register("saturation", function (adjust) {
	    adjust *= -0.01;
	
	    return new _filter2.default(function () {
	      var max = Math.max(this.r, this.g, this.b);
	      if (this.r !== max) this.r += (max - this.r) * adjust;
	      if (this.g !== max) this.g += (max - this.g) * adjust;
	      if (this.b !== max) this.b += (max - this.b) * adjust;
	    });
	  });
	
	  Caman.Renderer.register("vibrance", function (adjust) {
	    adjust *= -1;
	
	    return new _filter2.default(function () {
	      var max = Math.max(this.r, this.g, this.b);
	      var avg = (this.r + this.g + this.b) / 3;
	      var amt = Math.abs(max - avg) * 2 / 255 * adjust / 100;
	
	      if (this.r !== max) this.r += (max - this.r) * amt;
	      if (this.g !== max) this.g += (max - this.g) * amt;
	      if (this.b !== max) this.b += (max - this.b) * amt;
	    });
	  });
	
	  Caman.Renderer.register("greyscale", function (adjust) {
	    return new _filter2.default(function () {
	      this.r = this.g = this.b = _calculate2.default.luminance(this.r, this.g, this.b);
	    });
	  });
	
	  Caman.Renderer.register("contrast", function (adjust) {
	    adjust = Math.pow((adjust + 100) / 100, 2);
	
	    return new _filter2.default(function () {
	      this.r = ((this.r / 255 - 0.5) * adjust + 0.5) * 255;
	      this.g = ((this.g / 255 - 0.5) * adjust + 0.5) * 255;
	      this.b = ((this.b / 255 - 0.5) * adjust + 0.5) * 255;
	    });
	  });
	}

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Calculate = function () {
	  function Calculate() {
	    _classCallCheck(this, Calculate);
	  }
	
	  _createClass(Calculate, null, [{
	    key: "luminance",
	    value: function luminance(r, g, b) {
	      return 0.299 * r + 0.587 * g + 0.114 * b;
	    }
	  }]);
	
	  return Calculate;
	}();
	
	exports.default = Calculate;

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Color = function () {
	  function Color() {
	    _classCallCheck(this, Color);
	  }
	
	  _createClass(Color, null, [{
	    key: "hexToRGB",
	    value: function hexToRGB(hex) {
	      if (hex.charAt(0) == "#") hex = hex.substr(1);
	
	      return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
	    }
	  }]);
	
	  return Color;
	}();
	
	exports.default = Color;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Convolution = Convolution;
	
	var _kernel_filter = __webpack_require__(10);
	
	var _kernel_filter2 = _interopRequireDefault(_kernel_filter);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function Convolution(Caman) {}

/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var KernelFilter = function KernelFilter() {
	  _classCallCheck(this, KernelFilter);
	};
	
	exports.default = KernelFilter;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=caman.js.map