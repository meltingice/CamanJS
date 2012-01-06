// The filters define all of the built-in functionality that comes with Caman 
// (as opposed to being provided by a plugin). All of these filters are rather 
// basic, but are extremely powerful when many are combined. For information on 
// creating plugins, check out the [Plugin Creation](http://camanjs.com/docs/plugin-creation)
// page, and for information on using the plugins, check out the
// [Built-In Functionality](http://camanjs.com/docs/built-in) page.

/*global Caman: true */ 
(function(Caman) {
  
  // ## Fill Color
  // Fills the canvas with a single solid color.
  // 
  // ### Arguments
  // Can take either separate R, G, and B values as arguments, or a single hex color value.
  Caman.manip.fillColor = function () {
    var color;
    if (arguments.length == 1) {
      // If there's only 1 argument present, assume its a hex color and convert it to RGB.
      color = Caman.hex_to_rgb(arguments[0]);
    } else {
      color = {
        r: arguments[0],
        g: arguments[1],
        b: arguments[2]
      };
    }
    
    // Simply set every pixel in the canvas to the given RGB color.
    return this.process( color, function fillColor(color, rgba) {
      rgba.r = color.r;
      rgba.g = color.g;
      rgba.b = color.b;
      
      return rgba;
    });
  };

  // ## Brightness
  // Simple brightness adjustment
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will darken image while values > 0 will brighten.
  Caman.manip.brightness = function(adjust) {
    adjust = Math.floor(255 * (adjust / 100));
    
    // Simply increase all 3 color channels by the given amount
    return this.process( adjust,  function brightness(adjust, rgba) {
      rgba.r += adjust;
      rgba.g += adjust;
      rgba.b += adjust;
      
      return rgba;
    });
  };

  // ## Saturation
  // Adjusts the color saturation of the image.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will desaturate the image while values > 0 will saturate it.
  // **If you want to completely desaturate the image**, using the greyscale filter is highly 
  // recommended because it will yield better results.
  Caman.manip.saturation = function(adjust) {
    var max, diff;
    adjust *= -0.01;
    
    return this.process( adjust, function saturation(adjust, rgba) {
      var chan;
      
      // Find the max value across all 3 channels
      max = Math.max(rgba.r, rgba.g, rgba.b);
      
      // Go through each channel, and if it isn't the max, adjust it by the given amount.
      if (rgba.r !== max) {
        diff = max - rgba.r;
        rgba.r += diff * adjust;
      }
      
      if (rgba.g !== max) {
        diff = max - rgba.g;
        rgba.g += diff * adjust; 
      }
      
      if (rgba.b !== max) {
        diff = max - rgba.b;
        rgba.b += diff * adjust;
      }
      
      return rgba;
    });
  };
  
  // ## Vibrance
  // Similar to saturation, but adjusts the saturation levels in a slightly smarter, more subtle way. 
  // Vibrance will attempt to boost colors that are less saturated more and boost already saturated
  // colors less, while saturation boosts all colors by the same level.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will desaturate the image while values > 0 will saturate it.
  // **If you want to completely desaturate the image**, using the greyscale filter is highly recommended
  // because it will yield better results.
  Caman.manip.vibrance = function (adjust) {
    var max, avg, amt, diff;
    adjust *= -1;
    
    return this.process( adjust, function vibrance(adjust, rgba) {
      var chan;
      
      // Find the max value across all 3 channels
      max = Math.max(rgba.r, rgba.g, rgba.b);
      
      // Calculate difference between max color and other colors
      avg = (rgba.r + rgba.g + rgba.b) / 3;
      amt = ((Math.abs(max - avg) * 2 / 255) * adjust) / 100;
      
      // Go through each channel, and if it isn't the max, adjust it by the weighted given amount.
      if (rgba.r !== max) {
        diff = max - rgba.r;
        rgba.r += diff * amt;
      }
      
      if (rgba.g !== max) {
        diff = max - rgba.g;
        rgba.g += diff * amt;
      }
      
      if (rgba.b !== max) {
        diff = max - rgba.b;
        rgba.b += diff * amt;
      }
      
      return rgba;
    });
  };
  
  // ## Greyscale
  // An improved greyscale function that should make prettier results
  // than simply using the saturation filter to remove color. It does so by using factors
  // that directly relate to how the human eye perceves color and values. There are
  // no arguments, it simply makes the image greyscale with no in-between.
  //
  // Algorithm adopted from http://www.phpied.com/image-fun/
  Caman.manip.greyscale = function () {
    return this.process({}, function greyscale(adjust, rgba) {
      // Calculate the average value of the 3 color channels using the special factors
      var avg = 0.3 * rgba.r + 0.59 * rgba.g + 0.11 * rgba.b;
      
      // Set all color channels to the same average value
      rgba.r = avg;
      rgba.g = avg;
      rgba.b = avg;
      
      return rgba;
    });
  };
  
  // ## Contrast
  // Increases or decreases the color contrast of the image.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will decrease contrast while values > 0 will increase contrast.
  // The contrast adjustment values are a bit sensitive. While unrestricted, sane adjustment values are
  // usually around 5-10.
  Caman.manip.contrast = function(adjust) {
    adjust = (adjust + 100) / 100;
    adjust = Math.pow(adjust, 2);

    return this.process( adjust, function contrast(adjust, rgba) {
      // Red channel
      rgba.r /= 255;
      rgba.r -= 0.5;
      rgba.r *= adjust;
      rgba.r += 0.5;
      rgba.r *= 255;
      
      // Green channel
      rgba.g /= 255;
      rgba.g -= 0.5;
      rgba.g *= adjust;
      rgba.g += 0.5;
      rgba.g *= 255;
      
      // Blue channel
      rgba.b /= 255;
      rgba.b -= 0.5;
      rgba.b *= adjust;
      rgba.b += 0.5;
      rgba.b *= 255;
      
      // While uglier, I found that using if statements are
      // faster than calling Math.max() and Math.min() to bound
      // the numbers.
      if (rgba.r > 255) {
        rgba.r = 255;
      } else if (rgba.r < 0) {
        rgba.r = 0;
      }
      
      if (rgba.g > 255) {
        rgba.g = 255;
      } else if (rgba.g < 0) {
        rgba.g = 0;
      }
      
      if (rgba.b > 255) {
        rgba.b = 255;
      } else if (rgba.b < 0) {
        rgba.b = 0;
      }
              
      return rgba;
    });
  };
  
  // ## Hue
  // Adjusts the hue of the image. It can be used to shift the colors in an image in a uniform fashion.
  // If you are unfamiliar with Hue, I recommend reading this [Wikipedia article](http://en.wikipedia.org/wiki/Hue).
  //
  // ### Arguments
  // Range is 0 to 100
  // Sometimes, Hue is expressed in the range of 0 to 360. If that's the terminology you're used to, think of 0 to 100
  // representing the percentage of Hue shift in the 0 to 360 range.
  Caman.manip.hue = function(adjust) {
    var hsv, h;

    return this.process( adjust, function hue(adjust, rgba) {
      var rgb;
      
      // Convert current pixel to HSV color space
      hsv = Caman.rgb_to_hsv(rgba.r, rgba.g, rgba.b);
      
      // Convert the hue percentage to a non-fractional number out of 100
      h = hsv.h * 100;
      
      // Shift the hue value by the given amount
      h += Math.abs(adjust);
      
      // Wrap the shift around if it goes over 100.
      h = h % 100;
      
      // Convert the hue back into a percentage
      h /= 100;
      
      // Apply the updated hue value
      hsv.h = h;
      
      // Convert back to RGB color space
      rgb = Caman.hsv_to_rgb(hsv.h, hsv.s, hsv.v);
      
      return {r: rgb.r, g: rgb.g, b: rgb.b};
    });
  };
  
  // ## Colorize
  // Uniformly shifts the colors in an image towards the given color. The adjustment range is from 0 to 100. 
  // The higher the value, the closer the colors in the image shift towards the given adjustment color.
  //
  // ### Arguments
  // This filter is polymorphic and can take two different sets of arguments. Either a hex color string and an adjustment
  // value, or RGB colors and an adjustment value.
  Caman.manip.colorize = function() {
    var diff, rgb, level;
            
    if (arguments.length === 2) {
      // If only 2 arguments, assume we were given a hex color string
      rgb = Caman.hex_to_rgb(arguments[0]);
      level = arguments[1];
    } else if (arguments.length === 4) {
      // Otherwise assume we have RGB colors
      rgb = {
        r: arguments[0],
        g: arguments[1],
        b: arguments[2]        
      };
      
      level = arguments[3];
    }
    
    return this.process( [ level, rgb ],  function colorize( adjust, rgba) {
        // adjust[0] == level; adjust[1] == rgb;
        rgba.r -= (rgba.r - adjust[1].r) * (adjust[0] / 100);
        rgba.g -= (rgba.g - adjust[1].g) * (adjust[0] / 100);
        rgba.b -= (rgba.b - adjust[1].b) * (adjust[0] / 100);
        
        return rgba;
    });
  };
  
  // ## Invert
  // Inverts all colors in the image by subtracting each color channel value from 255. No arguments.
  Caman.manip.invert = function () {
    return this.process({}, function invert (adjust, rgba) {
      rgba.r = 255 - rgba.r;
      rgba.g = 255 - rgba.g;
      rgba.b = 255 - rgba.b;
      
      return rgba;
    });
  };
  
  // ## Sepia
  // Applies an adjustable sepia filter to the image.
  //
  // ### Arguments
  // Assumes adjustment is between 0 and 100, which represents how much the sepia filter is applied.
  Caman.manip.sepia = function (adjust) {
    // If no adjustment value was given, assume 100% sepia
    if (adjust === undefined) {
      adjust = 100;
    }
    
    // Convert to percentage
    adjust = (adjust / 100);
    
    // All three color channels have special conversion factors that define what sepia is. Here we adjust each
    // channel individually, with the twist that you can partially apply the sepia filter.
    return this.process(adjust, function sepia (adjust, rgba) {
      rgba.r = Math.min(255, (rgba.r * (1 - (0.607 * adjust))) + (rgba.g * (0.769 * adjust)) + (rgba.b * (0.189 * adjust)));
      rgba.g = Math.min(255, (rgba.r * (0.349 * adjust)) + (rgba.g * (1 - (0.314 * adjust))) + (rgba.b * (0.168 * adjust)));
      rgba.b = Math.min(255, (rgba.r * (0.272 * adjust)) + (rgba.g * (0.534 * adjust)) + (rgba.b * (1- (0.869 * adjust))));
      
      return rgba;
    });
  };
  
  // ## Gamma
  // Adjusts the gamma of the image.
  //
  // ### Arguments
  // Range is from 0 to infinity, although sane values are from 0 to 4 or 5.
  // Values between 0 and 1 will lessen the contrast while values greater than 1 will increase it.
  Caman.manip.gamma = function (adjust) {
    return this.process(adjust, function gamma(adjust, rgba) {
      rgba.r = Math.pow(rgba.r / 255, adjust) * 255;
      rgba.g = Math.pow(rgba.g / 255, adjust) * 255;
      rgba.b = Math.pow(rgba.b / 255, adjust) * 255;
      
      return rgba;
    });
  };
  
  // ## Noise
  // Adds noise to the image on a scale from 1 - 100. However, the scale isn't constrained, so you can specify
  // a value > 100 if you want a LOT of noise.
  Caman.manip.noise = function (adjust) {
    // Convert the percentage into a 0 - 255 range.
    adjust = Math.abs(adjust) * 2.55;
    return this.process(adjust, function noise(adjust, rgba) {
      // Retrieve a random number between -adjust and adjust
      var rand = Caman.randomRange(adjust*-1, adjust);
      
      // Apply the random value to each color channel to adjust the brightness. This will be clamped automatically
      // by Caman later on if it goes below 0 or over 255.
      rgba.r += rand;
      rgba.g += rand;
      rgba.b += rand;
      
      return rgba;
    });
  };
  
  // ## Clip
  // Clips a color to max values when it falls outside of the specified range.
  //
  // ### Arguments
  // Supplied value should be between 0 and 100.
  Caman.manip.clip = function (adjust) {
    // Convert the percentage into a 0 - 255 range.
    adjust = Math.abs(adjust) * 2.55;
    
    // Go through each color channel, and clip the color if it falls outside of the
    // specified range.
    return this.process(adjust, function clip(adjust, rgba) {
      if (rgba.r > 255 - adjust) {
        rgba.r = 255;
      } else if (rgba.r < adjust) {
        rgba.r = 0;
      }
      
      if (rgba.g > 255 - adjust) {
        rgba.g = 255;
      } else if (rgba.g < adjust) {
        rgba.g = 0;
      }
      
      if (rgba.b > 255 - adjust) {
        rgba.b = 255;
      } else if (rgba.b < adjust) {
        rgba.b = 0;
      }
      
      return rgba;
    });
  };
  
  // ## Channels
  // Lets you modify the intensity of any combination of red, green, or blue channels individually.
  //
  // ### Arguments
  // Must be given at least one color channel to adjust in order to work.
  // Options format (must specify 1 - 3 colors):
  // <pre>{
  //   red: 20,
  //   green: -5,
  //   blue: -40
  // }</pre>
  Caman.manip.channels = function (options) {
    if (typeof(options) !== 'object') {
      return;
    }
    
    // Clean up the arguments object a bit
    for (var chan in options) {
      if (options.hasOwnProperty(chan)) {
        if (options[chan] === 0) {
          delete options[chan];
          continue;
        }
        
        // Convert to a percentage
        options[chan] = options[chan] / 100;
      }
    }
    
    // If there are no color channels, simply return
    if (options.length === 0) {
      return this;
    }
    
    // Go through each color channel and adjust it towards the given color.
    return this.process(options, function channels(options, rgba) {
      if (options.red) {
        if (options.red > 0) {
          // fraction of the distance between current color and 255
          rgba.r = rgba.r + ((255 - rgba.r) * options.red);
        } else {
          // adjust away from the given color
          rgba.r = rgba.r - (rgba.r * Math.abs(options.red));
        }
      }
      
      if (options.green) {
        if (options.green > 0) {
          rgba.g = rgba.g + ((255 - rgba.g) * options.green);
        } else {
          rgba.g = rgba.g - (rgba.g * Math.abs(options.green));
        }
      }
      
      if (options.blue) {
        if (options.blue > 0) {
          rgba.b = rgba.b + ((255 - rgba.b) * options.blue);
        } else {
          rgba.b = rgba.b - (rgba.b * Math.abs(options.blue));
        }
      }
      
      return rgba;
    });
  };
  
  // ## Curves
  // Curves implementation using Bezier curve equation. If you're familiar with the Curves functionality in Photoshop, 
  // this works in a very similar fashion.
  //
  // ### Arguments.
  // <pre>
  //   chan - [r, g, b, rgb]
  //   start - [x, y] (start of curve; 0 - 255)
  //   ctrl1 - [x, y] (control point 1; 0 - 255)
  //   ctrl2 - [x, y] (control point 2; 0 - 255)
  //   end   - [x, y] (end of curve; 0 - 255)
  // </pre>
  //
  // The first argument represents the channels you wish to modify with the filter. It can be an array of channels or a 
  // string (for a single channel). The rest of the arguments are 2-element arrays that represent point coordinates.
  // They are specified in the same order as shown in this image to the right. The coordinates are in the range of\
  // 0 to 255 for both X and Y values.
  //
  // The x-axis represents the input value for a single channel, while the y-axis represents the output value.
  Caman.manip.curves = function (chan, start, ctrl1, ctrl2, end) {
    var bezier, i;
    
    // If the channel(s) given are in the form of a string, split them into
    // an array.
    if (typeof chan === 'string') {
      chan = chan.split("");
    }
    
    // Generate a bezier curve with the given arguments, clamped between 0 and 255
    bezier = Caman.bezier(start, ctrl1, ctrl2, end, 0, 255);
    
    // If our curve starts after x = 0, initialize it with a flat line until
    // the curve begins.
    if (start[0] > 0) {
      for (i = 0; i < start[0]; i++) {
        bezier[i] = start[1];
      }
    }
    
    // ... and the same with the end point
    if (end[0] < 255) {
      for (i = end[0]; i <= 255; i++) {
        bezier[i] = end[1];
      }
    }
    
    // Once we have the complete bezier curve, it's a simple matter of using the array index
    // as the input value to get the output color value.
    return this.process({bezier: bezier, chans: chan}, function curves(opts, rgba) {
      for (var i = 0; i < opts.chans.length; i++) {
        rgba[opts.chans[i]] = opts.bezier[rgba[opts.chans[i]]];
      }
      
      return rgba;
    });
  };
  
  // ## Exposure
  // Adjusts the exposure of the image by using the curves function.
  //
  // ### Arguments
  // Range is -100 to 100. Values < 0 will decrease exposure while values > 0 will increase exposure.
  Caman.manip.exposure = function (adjust) {
    var p, ctrl1, ctrl2;
    
    // Convert to percentage
    p = Math.abs(adjust) / 100;

    // Generate our control points
    ctrl1 = [0, (255 * p)];
    ctrl2 = [(255 - (255 * p)), 255];
    
    if (adjust < 0) {
      ctrl1 = ctrl1.reverse();
      ctrl2 = ctrl2.reverse();
    }
    
    // Simply call the curves filter with our generated arguments
    return this.curves('rgb', [0, 0], ctrl1, ctrl2, [255, 255]);
  };

}(Caman));