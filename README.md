<img src="https://github.com/meltingice/CamanJS/raw/master/demo/img/camanjs.png" />

<h1>About the Project</h1>
CamanJS is an attempt at providing a simple to use interface for dynamically manipulating images completely in JS.  It strives to provide much of the basic functionality you would find in something like Photoshop.  By this I mean, image contrast, brightness, levels, saturation, etc. At this time, something as complex as the Clone Tool is out of the question (but if you're feeling brave, be my guest).

CamanJS is also not a canvas drawing library, per se.  It's main focus is manipulating images, not drawing new content.

<h1>How to Use</h1>
Using CamanJS is simple.  It goes something like this:

<pre>
Caman('path/to/image.jpg', '#canvas-id', function () {
	this.brightness(10);
	this.contrast(-5);
	this.saturation(-50);
	// and so on...
});
</pre>

or you can use it like this:

<pre>
Caman({
	src: 'path/to/image.jpg',
	canvas: '#canvas-id',
	ready: function () {
		this.brightness(10);
		this.contrast(-5);
		this.saturation(-50);
		// and so on...
	}
});
</pre>

<h1>How to Extend</h1>
Extending CamanJS is easy as well. It's accomplished by adding functions onto the manip object. Below is an example of how to do so:

<pre>
(function (Caman) {
	Caman.manip.fancy_filter = function (adjust) {
	
		// this.process will be run in a loop, and the
		// rgba object represents the current pixel's rgba
		// values. you *must* return the modified rgba object
		// for it to work properly.
		return this.process(function (rgba) {
			rgba.r += adjust;
			rgba.g -= adjust;
			rgba.b += adjust * 2;
			rgba.a = 0.9;
			
			return rgba;
		});
	};
}(Caman));
</pre>

<h2>Utility Functions</h2>
Caman comes with a very useful set of utility functions that you may find useful when extending it.  In the main body of the function thats extending Caman, you can simply access them through this.util.func_name(). Their names should be pretty self explanatory:

* rgb_to_hsl
* hsl_to_rgb
* rgb_to_hsv
* hsv_to_rgb
* hex_to_rgb

<h1>Project To-do</h1>
* Implement a way to specify canvas elements by class instead of id, and apply effects to all found canvases.
* Add lots more adjustments/effects
* Figure out if there's a way to load images cross-domain (don't think there is?)