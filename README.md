# About the Project

[![Build Status](https://secure.travis-ci.org/meltingice/CamanJS.png)](http://travis-ci.org/meltingice/CamanJS)

The main focus of CamanJS is manipulating images using the HTML5 canvas and Javascript. It's a combination of a simple-to-use interface with advanced and efficient image/canvas editing techniques. It is also completely library independent and can be safely used next to jQuery, YUI, Scriptaculous, MooTools, etc.

CamanJS is very easy to extend with new filters and plugins, and it comes with a wide array of image editing functionality, which is only growing as the community makes more plugins.

For more information, I highly recommend taking a look at the [official website](http://camanjs.com) where there is more comprehensive documentation and interactive demos. You can also [read the wiki](https://github.com/meltingice/CamanJS/wiki) for some basic information about the project and how to use it.

CamanJS is written in [Coffeescript](http://coffeescript.org) as of version 3.0. **It works both in-browser and in NodeJS.**

## About this Branch

This is an experimental branch where I am working on cleaning up both the CamanJS API and the source code considerably. It's a complete rewrite and is backwards incompatible with the current stable version all the way down to how the filters are written. I've ported most of the existing filters already, but there are still some left to do.

## Browser Usage

Include one of the versions from the `dist` folder (minified for production, non-minified for development). CamanJS uses browserify, so you can require it in the browser like you would in NodeJS.

```js
var Caman = require('caman');

// Load with base image from URL
Caman.fromURL('/images/test.jpg').then(function (caman) {
    // Attach the CamanJS canvas to the DOM. Can give a CSS selector
    // or a DOM node. This will *replace* the node with the canvas.
    caman.attach('#caman-canvas');

    // If this is undesired, you can insert the canvas manually.
    document.body.appendChild(caman.canvas);

    return caman.pipeline(function () {
        this.sharpen(10);
        this.brightness(10);
        this.contrast(40);
    }).then(function () {
        console.log("Render pass finished.");
    });
});
```

There are several other ways you can initialize CamanJS:

``` js
// Initialize with a blank white canvas
Caman.blank({width: 200, height: 200}).then(function (caman) {});

// Initialize from an img DOM node
Caman.fromImage(image).then(function (caman) {});

// Initialize from another canvas
Caman.fromCanvas(canvas).then(function (caman) {});
```


## Development

If you are a developer who is contributing directly to the project, there are some tools to help you out.

### Building

To install all dependencies required for development, run `npm install -d`.

To build, simply run `cake compile`. The resulting files will be placed in the dist/ folder.

## NodeJS Compatibility

NodeJS compatibility is not implemented yet, but is planned.
