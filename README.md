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


//	Examples from http://meltingice.github.com/CamanJS/


caman.init('img/example2.jpg', '#image-original', function () { });


caman.init('img/example2.jpg', '#image-brightness', function () {
	this.brightness(25);
});


caman.init('img/example2.jpg', '#image-saturation', function () {
	this.saturation(-100);
});


caman.init('img/example2.jpg', '#image-contrast', function () {
	this.contrast(20);
});


caman.init('img/example2.jpg', '#image-hue', function () {
	this.hue(120);
});


caman.init('img/example2.jpg', '#image-colorize', function () {
	this.colorize('#AF3D15', 30);
});


caman.init('img/example2.jpg', '#image-combined', function () {
	this.contrast(25);
	this.hue(5);
	this.colorize('#AF3D15', 25);
	this.saturation(-30);
	this.brightness(5);
});
</pre>

<h1>Project To-do</h1>
* Implement a way to specify canvas elements by class instead of id, and apply effects to all found canvases.
* Add lots more adjustments/effects
* Figure out if there's a way to load images cross-domain (don't think there is?)