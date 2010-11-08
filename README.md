<h1>About the Project</h1>
CamanJS is an attempt at providing a simple to use interface for dynamically manipulating images completely in JS.  It strives to provide much of the basic functionality you would find in something like Photoshop.  By this I mean, image contrast, brightness, levels, saturation, etc. At this time, something as complex as the Clone Tool is out of the question (but if you're feeling brave, be my guest).

CamanJS is also not a canvas drawing library, per se.  It's main focus is manipulating images, not drawing new content.

<h1>How to Use</h1>
Using CamanJS is simple.  It goes something like this:

<pre>
caman.init('path/to/image.jpg', '#canvas-id', function () {
	this.brightness(10);
	this.contrast(-5);
	this.saturation(-50);
	// and so on...
});
</pre>

<h1>Project To-do</h1>
* Implement a way to specify canvas elements by class instead of id, and apply effects to all found canvases.
* Add lots more adjustments/effects
* Figure out if there's a way to load images cross-domain (don't think there is?)