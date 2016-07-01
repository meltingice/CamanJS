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
	
	var _filter = __webpack_require__(3);
	
	var _camanLib = __webpack_require__(4);
	
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
	
	    this.context = new _context.Context(canvas);
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
	      return this.render().bind(this.context.renderer);
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return this.context.renderer.render();
	    }
	  }]);
	
	  return Caman;
	}();
	
	Caman.Filter = _filter.Filter;
	
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
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Context = function () {
	  function Context(canvas) {
	    _classCallCheck(this, Context);
	
	    this.canvas = canvas;
	    this.context = this.canvas.getContext('2d');
	    this.width = this.canvas.width;
	    this.height = this.canvas.height;
	    this.load();
	
	    this.renderer = new _renderer.Renderer(this);
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
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Renderer = function Renderer() {
	  _classCallCheck(this, Renderer);
	};
	
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
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.CamanLib = CamanLib;
	
	var _filters = __webpack_require__(5);
	
	var _convolution = __webpack_require__(6);
	
	function CamanLib(Caman) {
	  (0, _filters.Filters)(Caman);
	  (0, _convolution.Convolution)(Caman);
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Filters = Filters;
	
	var _filter = __webpack_require__(3);
	
	function Filters(Caman) {
	  Caman.Renderer.register("brightness", function (adjust) {
	    adjust = Math.floor(255 * (adjust / 100));
	
	    return new _filter.Filter(function () {
	      this.r += adjust;
	      this.g += adjust;
	      this.b += adjust;
	    });
	  });
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Convolution = Convolution;
	
	var _kernel_filter = __webpack_require__(7);
	
	function Convolution(Caman) {}

/***/ },
/* 7 */
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