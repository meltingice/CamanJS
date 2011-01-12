<img src="https://github.com/meltingice/CamanJS/raw/master/demo/img/camanjs.png" />

<h1>About the Project</h1>
CamanJS is an attempt at providing a simple to use interface for dynamically manipulating images completely in JS.  It strives to provide much of the basic functionality you would find in something like Photoshop.  By this I mean, image contrast, brightness, levels, saturation, etc. At this time, something as complex as the Clone Tool is out of the question (but if you're feeling brave, be my guest).

CamanJS is also not a canvas drawing library, per se.  It's main focus is manipulating images, not drawing new content.

If you're looking for more information, <a href="http://blog.meltingice.net/programming/camanjs-javascript-image-manipulation/">here is a blog post</a> that describes the project some more.

<h2>Block Renderer</h2>
CamanJS now uses a block rendering system, which gives some notable benefits:

* Image rendering is now asynchronous, which means page rendering is no longer blocked.
* Slower filters (such as contrast) get a nice speed improvement due to render concurrency.

The way the renderer works is:

1. When each filter function is called, instead of rendering immediately, they are added to a render queue.
2. When the render() function is called, THEN the rendering actually begins.
3. The next filter is shifted off of the render queue and sent to the rendering function.
4. The image is divided into X number of blocks, which are simply horizontal partitions in the image.
5. The filter is performed on each block simultaneously by using setTimeout() with a 0ms timeout value. Using setTimeout() is what forces each block to render asynchronously, even if the timeout value is 0.
6. When a block is finished being rendered, it calls a function that tracks the # of blocks that have finished. When all blocks have finished, it signals that the filter is finished rendering.
7. If there are more filters in the render queue, then steps 3-6 happen for each until the queue empties.
8. When the queue empties, the callback supplied to render() is called.

The concurrency defaults to 4 blocks, but you can change this to whatever number you want by changing the Caman global variable renderBlocks:

<pre>
Caman.renderBlocks = 8; // even number recommended
</pre>

<h1>How to Use</h1>
Using CamanJS is simple.  It goes something like this:

<pre>
Caman('path/to/image.jpg', '#canvas-id', function () {
	this.brightness(10);
	this.contrast(-5);
	this.saturation(-50);
	// and so on...
	
	this.render();
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
		
		this.render();
	}
});
</pre>

You can now even save images after they've been modified!  With the current implementation, users will have to rename the file to something.(png|jpg) since they get redirected to the base64 encoding of the image and the browser doesn't know the file type.  The save() function defaults to png, but you can override this and specify either png or jpg.

<pre>
Caman('img/example.jpg', '#image-caman', function () {
  this.saturation(-20);
  this.brightness(10);
  
  // More info on finished() in events section below
  this.render(function () {
    this.save('png'); // shows a download file prompt
  });
});
</pre>

<h1>Caman Events</h1>
Currently CamanJS has three different events you can listen for, and it is very simple to add new events if you need to.

* processStart
  * fired when a single image filter begins manipulating an image
* processComplete
  * fired when a single image filter finishes manipulating an image
* queueFinished
  * fired when all image filters are done and an image is finished being updated
  
You may also find this extremely handy:

<pre>
Caman('img/example.jpg', '#image-caman', function () {
  this.contrast(25);
  this.hue(5);
  this.colorize('#AF3D15', 25);
  this.saturation(-30);
  this.brightness(5);
  
  // Event helper that fires when *this* image is finished rendering
  this.render(function () {
    console.log("Image finished rendering!");
  });
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
CamanJS comes with a set of utility functions that you may find very useful when extending it.  In the main body of the function thats extending CamanJS, you can simply access them through Caman.func_name(). Their names should be pretty self explanatory:

* rgb_to_hsl()
* hsl_to_rgb()
* rgb_to_hsv()
* hsv_to_rgb()
* rgb_to_xyz()
* xyz_to_rgb()
* xyz_to_lab()
* lab_to_xyz()
* hex_to_rgb()

<h1>Testing</h1>
CamanJS has both QUnit unit testing and a custom benchmarking page to monitor render times on a per-filter basis.  Simply open test/index.html for the QUnit tests, and test/benchmark.html for the benchmarking tests.

If you add a filter, please edit test/benchmark/benchmark.js and add your filter (with appropriate args) to the list at the top of the file.

<h1>Project To-do</h1>
* Implement a way to specify canvas elements by class instead of id, and apply effects to all found canvases.
* Add lots more adjustments/effects
* Figure out if there's a way to load images cross-domain (don't think there is?)