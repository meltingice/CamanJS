/*
 * jQuery plugin adapter for CamanJS
 */
if (window.jQuery) {
  window.jQuery.fn.caman = function (callback) {
    return this.each(function () {
      Caman(this, callback);
    });
  };
}