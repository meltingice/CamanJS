<img src="http://camanjs.com/imgs/logo.png" />

<h1>About the Project</h1>
The main focus of CamanJS is manipulating images using the HTML5 canvas and Javascript. It's a combination of a simple-to-use interface with advanced and efficient image/canvas editing techniques. It is also completely library independent and can be safely used next to jQuery, YUI, Scriptaculous, MooTools, etc.

CamanJS is very easy to extend with new filters and plugins, and it comes with a wide array of image editing functionality, which is only growing as the community makes more plugins.

For more information, I highly recommend taking a look at the <a href="http://camanjs.com">official website</a> where there is more comprehensive documentation and interactive demos. You can also <a href="https://github.com/meltingice/CamanJS/wiki">read the wiki</a> for some basic information about the project and how to use it.

<h1>Node Dependencies</h1>

In order to run CamanJS in Node, we need to simulate the HTML canvas. Because of that, there are a few dependencies:

* cairo >= 1.10.0
  * Beware: the version in Homebrew is not up to date.
* libjpeg
* <a href="https://github.com/LearnBoost/node-canvas">node-canvas</a>

<h1>How to Use</h1>

<h2>Install</h2>
CamanJS is now a part of npm. Simply run:

<pre>
npm install caman
</pre>

It will install the node-canvas dependency if you don't have it installed already.

<h2>Usage</h2>
Using CamanJS is simple.  It goes something like this:

<pre>
var Caman = require('caman').Caman;

Caman('path/to/image.jpg', function () {
	this.brightness(10);
	this.contrast(-5);
	this.saturation(-50);
	// and so on...
	
	this.render(function () {
		/*
		 * Currently only supports writing to PNG files.
		 * 2nd parameter forces CamanJS to overwrite the output
		 * file if it already exists.
		 */
		this.save("path/to/output.png", true);
	});
});
</pre>

<h1>Project Contributors</h1>

* <a href="http://twitter.com/meltingice">Ryan LeFevre</a> - Project Creator, Maintainer, and Lead Developer
* <a href="http://twitter.com/rwaldron">Rick Waldron</a> - Plugin Architect and Developer
* <a href="http://twitter.com/cezarsa">Cezar S‡ Espinola</a> - Developer
* <a href="http://twitter.com/jarques">Jarques Pretorius</a> - Logo Designer