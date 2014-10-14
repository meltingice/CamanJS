require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"xWodkT":[function(require,module,exports){
require('./caman-lib/filters.coffee');


},{"./caman-lib/filters.coffee":3}],"caman-lib":[function(require,module,exports){
module.exports=require('xWodkT');
},{}],3:[function(require,module,exports){
Caman.Renderer.filter('brightness', function(adjust) {
  adjust = Math.floor(255 * (adjust / 100));
  return new Caman.Filter(function() {
    this.r += adjust;
    this.g += adjust;
    return this.b += adjust;
  });
});


},{}]},{},[])

require('caman-lib');