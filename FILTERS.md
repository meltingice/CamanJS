<h1>Filter Reference</h1>

All of the filters below are included with the core CamanJS filter library.  Any filters added via plugins should have their own reference.

<h2>brightness</h2>
Simple brightness adjustment.

* Arguments:
  1. Integer (required) adjustment from -100 to 100
  
<h2>clip</h2>
Clips colors in the photo based on the user-given range.

* Arguments:
  1. Integer (required) adjustment from 0 to 100
  
<h2>channels</h2>
Allows fine-tuned adjustment of the red, green, and blue channels individually.

* Arguments:
  1. Object (required) At least 1 channel is required, range is from -100 to 100.

Example:  
<pre>
{
  red: 20,
  green: -10,
  blue: 5
}
</pre>

<h2>colorize</h2>
Adjusts the image by gradually shifting each pixel towards the given color by a user-given percentage.

* Arguments:
  1. String or Object (required). If object, it must contain the properties r, g, b to define a color. If String, it must be in hex color format (leading # symbol is optional).
  2. Integer (required) adjustment amount, 0 - 100
  
<h2>contrast</h2>
Adjusts the contrast of the image

* Arguments:
  1. Integer (required) Adjustment amount, 0 - 100
  
<h2>gamma</h2>
Allows you to adjust the gamma of the image.

* Arguments
  1. Integer (required) the adjustment value (I would stick with low values to be safe).
  
<h2>greyscale</h2>
An optimized greyscale filter that converts the image to a human-eye friendly version. It does this by using special color channel coefficients instead of simply using the average value across the red, green, and blue channels.

* Arguments: none!

<h2>hue</h2>
Adjusts the hue of the image by the specified amount.

* Arguments
  1. Integer (required) adjustment amount from 0 to 360.
  
<h2>invert</h2>
Inverts all colors in the image.

* Arguments: none!

<h2>noise</h2>
Adds random noise to the image.

* Arguments:
  1. Integer (required) the amount of noise to add, 0 - 100
  
<h2>saturation</h2>
Saturates or desaturates the colors in the image. Please note that if you want to fully desaturate the image, it's highly recommended that you use the greyscale() function instead as it will produce better results.

* Arguments:
  1. Integer (required) adjustment amount, negative desaturates and positive saturates, 0 - 100
  
<h2>sepia</h2>
Applies a sepia filter to the image in adjustable amounts

* Arguments:
  1. Integer (required) how much of the sepia filter to apply, 0 - 100
  