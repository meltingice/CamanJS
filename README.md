<img src="http://camanjs.com/imgs/logo.png" />

<h1>About the Project</h1>
The main focus of CamanJS is manipulating images using the HTML5 canvas and Javascript. It's a combination of a simple-to-use interface with advanced and efficient image/canvas editing techniques. It is also completely library independent and can be safely used next to jQuery, YUI, Scriptaculous, MooTools, etc.

CamanJS is very easy to extend with new filters and plugins, and it comes with a wide array of image editing functionality, which is only growing as the community makes more plugins.

For more information, I highly recommend taking a look at the <a href="http://camanjs.com">official website</a> where there is more comprehensive documentation and interactive demos. You can also <a href="https://github.com/meltingice/CamanJS/wiki">read the wiki</a> for some basic information about the project and how to use it.

<h2>Cloning the Project</h2>
CamanJS uses git submodules in order to organize things a bit better. Because of this, you have a few options in making sure you get all the required files.

<b>Recursive Clone</b>

Recommended if you haven't cloned the project yet.

<pre>
git clone --recursive https://github.com/meltingice/CamanJS.git
</pre>

<b>Submodule Init</b>

If you have cloned the project already, you can do (after pulling the latest changes):

<pre>
git submodule init
git submodule update
</pre>

The library is split up into several source files and has a separate submodule for plugins. The reason behind this organization is to make it as simple as possible to support the NodeJS port of Caman. This also helps to avoid library bloat.

<b>Makefile</b>

The NodeJS powered Makefile for the project will automatically check to make sure you've initialized the submodules, and if you haven't, will do so for you. Simply run:

<pre>
make
</pre>

<h2>CDN JS Hosting</h2>
CamanJS is hosted on CDN JS if you're looking for a CDN hosting solution. It is the full and minified version of the library, which means all plugins are included. Simply load CamanJS directly from <a href="http://ajax.cdnjs.com/ajax/libs/camanjs/2.1.3/caman.full.min.js">this URL</a> for usage on your site.

<h2>NodeJS Compatibility</h2>
There is now a version of CamanJS that is made to work with NodeJS.  It has all of the functionality of the normal browser version, including plugins.  Take a look at the <a href="https://github.com/meltingice/CamanJS/tree/node">node branch</a> for more information.

**tl;dr**

	npm install caman

<h1>Testing</h1>
CamanJS has both QUnit unit testing and a custom benchmarking page to monitor render times on a per-filter basis.  Simply open test/index.html for the QUnit tests, and test/benchmark.html for the benchmarking tests.

<h1>Project Contributors</h1>

* <a href="http://twitter.com/meltingice">Ryan LeFevre</a> - Project Creator, Maintainer, and Lead Developer
* <a href="http://twitter.com/rwaldron">Rick Waldron</a> - Plugin Architect and Developer
* <a href="http://twitter.com/cezarsa">Cezar Sá Espinola</a> - Developer
* <a href="http://twitter.com/jarques">Jarques Pretorius</a> - Logo Designer
