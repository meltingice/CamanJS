// The entire layering system for Caman resides in this file. Layers get their own canvasLayer object 
// which is created when newLayer() is called. For extensive information regarding the specifics of how 
// the layering system works, there is an in-depth blog post on this very topic. Instead of copying the 
// entirety of that post, I'll simply point you towards the blog link.
//
// However, the gist of the layering system is that, for each layer, it creates a new canvas element and 
// then either copies the parent layer's data or applies a solid color to the new layer. After some (optional) 
// effects are applied, the layer is blended back into the parent canvas layer using one of many different 
// blending algorithms.
//
// You can also load an image (local or remote, with a proxy) into a canvas layer, which is useful if you want 
// to add textures to an image.

/*global Caman: true */
(function (Caman) {

// Loads another image into a canvas layer that can be either local or remote (with a proxy). This function is
// executed at render time so that the end-user doesn't have to worry about the image loading asynchronously.
Caman.manip.loadOverlay = function (layer, src) {
  var proxyUrl = Caman.remoteCheck(src),
  self = this;
  
  // Apply the proxy if the image is remote and a proxy exists.
  if (proxyUrl) {
    src = proxyUrl;
  }
  
  // Create an image element, apply the URL, and wait for load
  var img = document.createElement('img');
  img.onload = function () {
    // Once the image loads, draw it on to the layer's canvas.
    layer.context.drawImage(img, 0, 0, self.dimensions.width, self.dimensions.height);
    layer.image_data = layer.context.getImageData(0, 0, self.dimensions.width, self.dimensions.height);
    layer.pixel_data = layer.image_data.data;
    
    self.pixel_data = layer.pixel_data;
    
    // Done! Move to the next render operative
    self.processNext();
  };
  
  img.src = src;
};

// Object that represents a canvas layer
Caman.manip.canvasLayer = function (manip) {  
  // Default options
  this.options = {
    blendingMode: 'normal',
    opacity: 1.0
  };
  
  // Create a blank and invisible canvas. We store the reference to the canvas as a part of the canvasLayer
  // object instead of appending it to the DOM.
  this.layerID = Caman.uniqid.get();
  this.canvas = document.createElement('canvas');
  
  // Give the canvas the same dimensions as the parent canvas
  this.canvas.width = manip.dimensions.width;
  this.canvas.height = manip.dimensions.height;
  
  this.context = this.canvas.getContext("2d");
  this.context.createImageData(this.canvas.width, this.canvas.height);
  this.image_data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  this.pixel_data = this.image_data.data;

  // Define a getter for filter that returns the manip object so that we can use all of the normal
  // filters on this layer.
  this.__defineGetter__("filter", function () {
    return manip;
  });

  return this;
};

// Enables nesting of layers since this calls the newLayer function from the manip object, but
// changes the context of `this` to this layer instead of the original parent canvas.
Caman.manip.canvasLayer.prototype.newLayer = function (callback) {
  return this.filter.newLayer.call(this.filter, callback);
};

// Sets the blending mode to one of the defined blenders
Caman.manip.canvasLayer.prototype.setBlendingMode = function (mode) {
  this.options.blendingMode = mode;
  return this;
};

// Sets the opacity of the layer, which dictates how much of the layer is applied during blending.
Caman.manip.canvasLayer.prototype.opacity = function (opacity) {
  this.options.opacity = (opacity / 100);
  return this;
};

// Copies the contents of the parent layer to this layer.
Caman.manip.canvasLayer.prototype.copyParent = function () {
  // Grab the pixel data from the parent layer
  var parentData = this.filter.pixel_data;
  
  // Unfortunately we can't set this all at once since (I believe) that would create a reference
  // to the parent pixel array instead of copying the data. By directly setting the individual
  // primitive values, they become copied.
  for (var i = 0; i < this.pixel_data.length; i += 4) {
    this.pixel_data[i]    = parentData[i];
    this.pixel_data[i+1]  = parentData[i+1];
    this.pixel_data[i+2]  = parentData[i+2];
    this.pixel_data[i+3]  = parentData[i+3];
  }
  
  return this;
};

// Shortcut for flooding this layer with a solid color
Caman.manip.canvasLayer.prototype.fillColor = function () {
  this.filter.fillColor.apply(this.filter, arguments);
  return this;
};

// Load a remote image and overlay it on this layer. The image will be downloaded and applied at render-time,
// so this function is not asynchronous.
Caman.manip.canvasLayer.prototype.overlayImage = function (image) {
  if (image[0] == '#') {
    // If the given image is a DOM ID instead of a URL
    image = Caman.$(image).src;
  } else if (typeof image === "object") {
    // If the given image is a DOM image object
    image = image.src;
  }
  
  // Some problem, skip to prevent errors
  if (!image) return;
  
  this.filter.renderQueue.push({type: Caman.ProcessType.LOAD_OVERLAY, src: image, layer: this});
  
  return this;
};

// Leaving this here for compatibility reasons. It is NO
// LONGER REQUIRED at the end of the layer.
Caman.manip.canvasLayer.prototype.render = function () {};

// Apply the content of this layer to the parent layer. This occurs at render time and should never be directly
// called by the user.
Caman.manip.canvasLayer.prototype.applyToParent = function () {
  // Grab the parent's pixel data off of the pixel stack
  var parentData = this.filter.pixelStack[this.filter.pixelStack.length - 1],
  layerData = this.filter.pixel_data,
  rgbaParent = {},
  rgbaLayer = {},
  result = {};

  for (var i = 0; i < layerData.length; i += 4) {
    // Create an RGBA object for the parent layer
    rgbaParent = {
      r: parentData[i],
      g: parentData[i+1],
      b: parentData[i+2],
      a: parentData[i+3]
    };
    
    // Create an RGBA object for this layer
    rgbaLayer = {
      r: layerData[i],
      g: layerData[i+1],
      b: layerData[i+2],
      a: layerData[i+3]
    };
    
    // Send the parent and layer RGBA data for this pixel to the specified blender
    result = this.blenders[this.options.blendingMode](rgbaLayer, rgbaParent);
    
    // Clamp the RGB values to follow the latest canvas spec.
    result.r = Caman.clampRGB(result.r);
    result.g = Caman.clampRGB(result.g);
    result.b = Caman.clampRGB(result.b);
    
    parentData[i]   = rgbaParent.r - ((rgbaParent.r - result.r) * (this.options.opacity * (result.a / 255)));
    parentData[i+1] = rgbaParent.g - ((rgbaParent.g - result.g) * (this.options.opacity * (result.a / 255)));
    parentData[i+2] = rgbaParent.b - ((rgbaParent.b - result.b) * (this.options.opacity * (result.a / 255)));
    parentData[i+3] = 255;
  }
};

// Built-in layer blenders. Many of these mimic Photoshop blend modes.
Caman.manip.canvasLayer.prototype.blenders = {

  // Directly apply the child layer's pixels to the parent layer with no special changes
  normal: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaLayer.r,
      g: rgbaLayer.g,
      b: rgbaLayer.b,
      a: 255
    };
  },
  
  // Apply the child to the parent by multiplying the color values. This generally creates contrast.
  multiply: function (rgbaLayer, rgbaParent) {
    return {
      r: (rgbaLayer.r * rgbaParent.r) / 255,
      g: (rgbaLayer.g * rgbaParent.g) / 255,
      b: (rgbaLayer.b * rgbaParent.b) / 255,
      a: 255
    };
  },
  
  screen: function (rgbaLayer, rgbaParent) {
    return {
      r: 255 - (((255 - rgbaLayer.r) * (255 - rgbaParent.r)) / 255),
      g: 255 - (((255 - rgbaLayer.g) * (255 - rgbaParent.g)) / 255),
      b: 255 - (((255 - rgbaLayer.b) * (255 - rgbaParent.b)) / 255),
      a: 255
    };
  },
  
  overlay: function (rgbaLayer, rgbaParent) {
    var result = {};
    result.r = 
      (rgbaParent.r > 128) ? 
        255 - 2 * (255 - rgbaLayer.r) * (255 - rgbaParent.r) / 255: 
        (rgbaParent.r * rgbaLayer.r * 2) / 255;
        
    result.g = 
      (rgbaParent.g > 128) ? 
        255 - 2 * (255 - rgbaLayer.g) * (255 - rgbaParent.g) / 255: 
        (rgbaParent.g * rgbaLayer.g * 2) / 255;
        
    result.b = 
      (rgbaParent.b > 128) ? 
        255 - 2 * (255 - rgbaLayer.b) * (255 - rgbaParent.b) / 255: 
        (rgbaParent.b * rgbaLayer.b * 2) / 255;
    
    result.a = 255;
    return result;
  },
  
  difference: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaLayer.r - rgbaParent.r,
      g: rgbaLayer.g - rgbaParent.g,
      b: rgbaLayer.b - rgbaParent.b,
      a: 255
    };
  },
  
  addition: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaParent.r + rgbaLayer.r,
      g: rgbaParent.g + rgbaLayer.g,
      b: rgbaParent.b + rgbaLayer.b,
      a: 255
    };
  },
  
  exclusion: function (rgbaLayer, rgbaParent) {
    return {
      r: 128 - 2 * (rgbaParent.r - 128) * (rgbaLayer.r - 128) / 255,
      g: 128 - 2 * (rgbaParent.g - 128) * (rgbaLayer.g - 128) / 255,
      b: 128 - 2 * (rgbaParent.b - 128) * (rgbaLayer.b - 128) / 255,
      a: 255
    };
  },
  
  softLight: function (rgbaLayer, rgbaParent) {
    var result = {};
    
    result.r = 
      (rgbaParent.r > 128) ? 
        255 - ((255 - rgbaParent.r) * (255 - (rgbaLayer.r - 128))) / 255 : 
        (rgbaParent.r * (rgbaLayer.r + 128)) / 255;
      
    result.g = 
      (rgbaParent.g > 128) ? 
        255 - ((255 - rgbaParent.g) * (255 - (rgbaLayer.g - 128))) / 255 : 
        (rgbaParent.g * (rgbaLayer.g + 128)) / 255;
    
    result.b = (rgbaParent.b > 128) ? 
      255 - ((255 - rgbaParent.b) * (255 - (rgbaLayer.b - 128))) / 255 : 
      (rgbaParent.b * (rgbaLayer.b + 128)) / 255;
      
    result.a = 255;
    return result;
  }
};

// Add the blenders object to the Caman.manip namespace to make it easier to extend.
Caman.manip.blenders = Caman.manip.canvasLayer.prototype.blenders;

// Queue that holds all of the layers that are waiting to be rendered
Caman.manip.canvasQueue = [];

// Factory method that creates a new layer and adds the layer to the render queue once
// all of the modifications are defined via the callback.
Caman.manip.newLayer = function (callback) {
  var layer = new Caman.manip.canvasLayer(this);
  
  // Store the new layer in the canvas queue for rendering later
  this.canvasQueue.push(layer);

  // Inform the renderer that we have a new layer coming up
  this.renderQueue.push({type: Caman.ProcessType.LAYER_DEQUEUE});  
  
  // Define the layer transformations
  callback.call(layer);
  
  // Let the renderer know the layer is finished
  this.renderQueue.push({type: Caman.ProcessType.LAYER_FINISHED});

  return this;
};

// Used during the rendering process. Directly correlates to the LAYER_DEQUEUE render event.
Caman.manip.executeLayer = function (layer) {
  this.pushContext(layer);
  this.processNext();
};

// Changes the rendering context to the upcoming layer for rendering.
Caman.manip.pushContext = function (layer) {
  console.log("PUSH LAYER!");
  
  // Push the layer onto the layer stack for processing
  this.layerStack.push(this.currentLayer);
  
  // Also push the pixel array into its own stack
  this.pixelStack.push(this.pixel_data);
  
  // Set the reference to the current layer
  this.currentLayer = layer;
  
  // Set the current pixel data array to the layer's pixel data
  this.pixel_data = layer.pixel_data;
};

// Once we are done rendering a layer, we can move back to the parent layer's context. This directly
// correlates to the LAYER_FINISHED render event.
Caman.manip.popContext = function () {
  console.log("POP LAYER!");
  
  // Restore the parent's pixel data (which has been modified by a blending function)
  this.pixel_data = this.pixelStack.pop();
  
  // Restore the reference to the current layer
  this.currentLayer = this.layerStack.pop();
};

// Shortcut for applying the current layer to the parent layer
Caman.manip.applyCurrentLayer = function () {
  this.currentLayer.applyToParent();
};

}(Caman));