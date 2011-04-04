/*
 * CamanJS layering system. Supports layer grouping and layer
 * ordering. Layers are blended into the parent layer using a variety
 * of blending functions, similar to what you would find in Photoshop
 * or GIMP.
 */
 
(function (Caman) {

Caman.manip.loadOverlay = function (layer, src) {
  var proxyUrl = Caman.remoteCheck(src),
  self = this;
  
  if (proxyUrl) {
    src = proxyUrl;
  }
  
  var img = document.createElement('img');
  img.onload = function () {
    layer.context.drawImage(img, 0, 0, self.dimensions.width, self.dimensions.height);
    layer.image_data = layer.context.getImageData(0, 0, self.dimensions.width, self.dimensions.height);
    layer.pixel_data = layer.image_data.data;
    
    self.pixel_data = layer.pixel_data;
    
    self.processNext();
  };
  img.src = src;
};

Caman.manip.canvasLayer = function (manip) {  
  // Default options
  this.options = {
    blendingMode: 'normal',
    opacity: 1.0
  };
  
  // Create a blank and invisible canvas and append it to the document
  this.layerID = Caman.uniqid.get();
  this.canvas = document.createElement('canvas');
  this.canvas.width = manip.dimensions.width;
  this.canvas.height = manip.dimensions.height;
  this.canvas.style.display = 'none';
  
  this.context = this.canvas.getContext("2d");
  this.context.createImageData(this.canvas.width, this.canvas.height);
  this.image_data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  this.pixel_data = this.image_data.data;

  this.__defineGetter__("filter", function () {
    return manip;
  });

  return this;
};

Caman.manip.canvasLayer.prototype.newLayer = function (callback) {
  return this.filter.newLayer.call(this.filter, callback);
};

Caman.manip.canvasLayer.prototype.setBlendingMode = function (mode) {
  this.options.blendingMode = mode;
  return this;
};

Caman.manip.canvasLayer.prototype.opacity = function (opacity) {
  this.options.opacity = (opacity / 100);
  return this;
};

Caman.manip.canvasLayer.prototype.copyParent = function () {
  var parentData = this.filter.pixel_data;
  
  for (var i = 0; i < this.pixel_data.length; i += 4) {
    this.pixel_data[i]    = parentData[i];
    this.pixel_data[i+1]  = parentData[i+1];
    this.pixel_data[i+2]  = parentData[i+2];
    this.pixel_data[i+3]  = parentData[i+3];
  }
  
  return this;
};

Caman.manip.canvasLayer.prototype.fillColor = function () {
  this.filter.fillColor.apply(this.filter, arguments);
  return this;
};

Caman.manip.canvasLayer.prototype.overlayImage = function (image) {
  if (image[0] == '#') {
    image = Caman.Caman.$(image).src;
  } else if (typeof image === "object") {
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

Caman.manip.canvasLayer.prototype.applyToParent = function () {
  var parentData = this.filter.pixelStack[this.filter.pixelStack.length - 1],
  layerData = this.filter.pixel_data,
  rgbaParent = {},
  rgbaLayer = {},
  result = {};

  for (var i = 0; i < layerData.length; i += 4) {
    rgbaParent = {
      r: parentData[i],
      g: parentData[i+1],
      b: parentData[i+2],
      a: parentData[i+3]
    };
    
    rgbaLayer = {
      r: layerData[i],
      g: layerData[i+1],
      b: layerData[i+2],
      a: layerData[i+3]
    };
    
    result = this.blenders[this.options.blendingMode](rgbaLayer, rgbaParent);
    
    result.r = Caman.clampRGB(result.r);
    result.g = Caman.clampRGB(result.g);
    result.b = Caman.clampRGB(result.b);
    
    parentData[i]   = rgbaParent.r - ((rgbaParent.r - result.r) * (this.options.opacity * (result.a / 255)));
    parentData[i+1] = rgbaParent.g - ((rgbaParent.g - result.g) * (this.options.opacity * (result.a / 255)));
    parentData[i+2] = rgbaParent.b - ((rgbaParent.b - result.b) * (this.options.opacity * (result.a / 255)));
    parentData[i+3] = 255;
  }
};

// Blending functions
Caman.manip.canvasLayer.prototype.blenders = {
  normal: function (rgbaLayer, rgbaParent) {
    return {
      r: rgbaLayer.r,
      g: rgbaLayer.g,
      b: rgbaLayer.b,
      a: 255
    };
  },
  
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

Caman.manip.blenders = Caman.manip.canvasLayer.prototype.blenders;

Caman.manip.canvasQueue = [];

Caman.manip.newLayer = function (callback) {
  var layer = new Caman.manip.canvasLayer(this);
  this.canvasQueue.push(layer);

  this.renderQueue.push({type: Caman.ProcessType.LAYER_DEQUEUE});  
  callback.call(layer);
  this.renderQueue.push({type: Caman.ProcessType.LAYER_FINISHED});

  return this;
};

Caman.manip.executeLayer = function (layer) {
  this.pushContext(layer);
  this.processNext();
};

Caman.manip.pushContext = function (layer) {
  console.log("PUSH LAYER!");
  
  this.layerStack.push(this.currentLayer);
  this.pixelStack.push(this.pixel_data);
  
  this.currentLayer = layer;
  this.pixel_data = layer.pixel_data;
};

Caman.manip.popContext = function () {
  console.log("POP LAYER!");
  
  this.pixel_data = this.pixelStack.pop();
  this.currentLayer = this.layerStack.pop();
};

Caman.manip.applyCurrentLayer = function () {
  this.currentLayer.applyToParent();
};

}(Caman));