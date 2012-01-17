<img src="http://camanjs.com/imgs/logo.png" />

# About the Project

The main focus of CamanJS is manipulating images using the HTML5 canvas and Javascript. It's a combination of a simple-to-use interface with advanced and efficient image/canvas editing techniques. It is also completely library independent and can be safely used next to jQuery, YUI, Scriptaculous, MooTools, etc.

CamanJS is very easy to extend with new filters and plugins, and it comes with a wide array of image editing functionality, which is only growing as the community makes more plugins.

For more information, I highly recommend taking a look at the [official website](http://camanjs.com) where there is more comprehensive documentation and interactive demos. You can also [read the wiki](https://github.com/meltingice/CamanJS/wiki) for some basic information about the project and how to use it.

CamanJS is written in [Coffeescript](http://coffeescript.org) as of version 3.0.

## Example Usage

```js
Caman("#image-id", function () {
  this.brightness(10);
  this.contrast(20);
  this.render(function () {
    alert("Done!");
  });
});
```

## Upgrading from 2.x to 3.x

For the end-user, there are no changes to CamanJS that will affect your code. Everything works exactly the same as before.

For developers, there are some major changes regarding how filters and plugins are added to CamanJS. Previously, you would explicitly extend the Caman.manip interface. This object no longer exists. Now, the way you add filters is:

``` coffeescript
Caman.Filter.register "filterName", ->
  # Variables that exist here will be available in the process function
  # because of JS closure.
  amt = 20

  @process "filterName", (rgba) ->
    # Alter rgba pixel object here
    return rgba
```

Plugins are similarly added:

``` coffeescript
Caman.Plugin.register "pluginName", ->
  return @
```

**Building CamanJS**

If you are a developer who is contributing directly to the project, there are some tools to help you out.

The requirements for building CamanJS are:

* node
* coffeescript
* jsmin (for node)

If you're running OSX and have Growl installed, it's also recommended you have:

* coffeescript-growl

To build, simply run:

```
cake build
```

The resulting files will be placed in the dist/ folder. Plugins will be automatically discovered and added to caman.full.js after the core library.

## CDN JS Hosting

CamanJS is hosted on CDN JS if you're looking for a CDN hosting solution. It is the full and minified version of the library, which means all plugins are included. Simply load CamanJS directly from [this URL](http://ajax.cdnjs.com/ajax/libs/camanjs/2.2/caman.full.min.js) for usage on your site.

## NodeJS Compatibility

This is currently in flux. The node branch will still have a working node version for now, as will npm, but it has not been upgraded to the new codebase yet.

**tl;dr**

```
npm install caman
```

# Testing

CamanJS has both QUnit unit testing and a custom benchmarking page to monitor render times on a per-filter basis.  Simply open test/index.html for the QUnit tests, and test/benchmark.html for the benchmarking tests.

# Project Contributors

* [Ryan LeFevre](http://twitter.com/meltingice) - Project Creator, Maintainer, and Lead Developer
* [Rick Waldron](http://twitter.com/rwaldron) - Plugin Architect and Developer
* [Cezar Sá Espinola](http://twitter.com/cezarsa) - Developer
* [Jarques Pretorius](http://twitter.com/jarques) - Logo Designer

# Plugin Contributors

* [Hosselaer](https://github.com/Hosselaer)
* [Mario Klingemann](http://www.quasimondo.com)
