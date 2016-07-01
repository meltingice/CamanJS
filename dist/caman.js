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
	
	var _filter = __webpack_require__(1);
	
	var _camanLib = __webpack_require__(2);
	
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
	    key: 'newContext',
	    value: function newContext(func) {
	      func.call(this.context.renderer);
	      return this.render().bind(this);
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
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Filter = function Filter(processFunc) {
	  _classCallCheck(this, Filter);
	};
	
	exports.default = Filter;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.CamanLib = CamanLib;
	
	var _filters = __webpack_require__(3);
	
	var _convolution = __webpack_require__(4);
	
	function CamanLib(Caman) {
	  (0, _filters.Filters)(Caman);
	  // Convolution(Caman);
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Filters = Filters;
	function Filters(Caman) {
	  Caman.Renderer.register("brightness", function (adjust) {
	    adjust = Math.floor(255 * (adjust / 100));
	
	    return new Caman.Filter(function () {});
	  });
	}

/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";

/***/ }
/******/ ])
});
;
//# sourceMappingURL=caman.js.map