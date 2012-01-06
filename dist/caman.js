(function() {
  var $, Root, Store;

  $ = function(sel, root) {
    if (root == null) root = document;
    if (typeof sel === "object") return sel;
    return root.querySelector(sel);
  };

  Root = typeof exports !== "undefined" && exports !== null ? exports : window;

  Root.Caman = function() {
    var tag;
    switch (arguments.length) {
      case 1:
        if (Store.has(arguments[0])) return Store.get(arguments[0]);
        return new ManipImage(arguments);
      case 2:
        if (Store.has(arguments[0])) {
          return Store.execute(arguments[0], arguments[1]);
        }
        if (typeof arguments[1] === 'function') {
          tag = $(arguments[0]).nodeName.toLowerCase();
          if (tag === "img") return new ManipImage(arguments);
          if (tag === "canvas") return new ManipCanvas(arguments);
        } else {
          return new ManipCanvas(arguments);
        }
        break;
      case 3:
        if (Store.has(arguments[0])) {
          return Store.execute(arguments[1], arguments[2]);
        }
        return new ManipCanvas(arguments);
    }
  };

  Caman.version = {
    release: "3.0",
    date: "1/2/12"
  };

  Store = (function() {

    function Store() {}

    Store.items = {};

    Store.has = function(search) {
      return this.items[search] != null;
    };

    Store.get = function(search) {
      return this.items[search];
    };

    Store.execute = function(search, callback) {
      return callback.call(this.get(search), this.get(search));
    };

    return Store;

  })();

}).call(this);
