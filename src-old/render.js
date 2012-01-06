// CamanJS's rendering system. This covers convolution kernels,
// pixel-wise filters, and plugins. All of the actual pixel/image
// manipulation is executed here when render() is called.

/*global Caman: true */
(function (Caman) {

// Defines how many slices we want to split the canvas up into for rendering.
// While Javascript is not multi-threaded, it does help to make each rendering
// job shorter, and to allow the browser more control in managing the render jobs.
Caman.renderBlocks = 4;

// * SINGLE = traverse the image 1 pixel at a time
// * KERNEL = traverse the image using convolution kernels
// * LAYER_DEQUEUE = shift a layer off the canvasQueue
// * LAYER_FINISHED = finished processing a layer
// * LOAD_OVERLAY = load a local/remote image into the layer canvas
// * PLUGIN = executes a plugin function that isn't pixelwise or kernel
Caman.ProcessType = {
  SINGLE: 1,
  KERNEL: 2,
  LAYER_DEQUEUE: 3,
  LAYER_FINISHED: 4,
  LOAD_OVERLAY: 5,
  PLUGIN: 6
};

Caman.manip.process = function (adjust, processFn) {
  // Since the block-based renderer is asynchronous, we simply build
  // up a render queue and execute the filters in order once
  // render() is called instead of executing them as they're called
  // synchronously.
  this.renderQueue.push({adjust: adjust, processFn: processFn, type: Caman.ProcessType.SINGLE});
  
  return this;
};

// Process info about kernel and store it for later rendering.
Caman.manip.processKernel = function (name, adjust, divisor, bias) {  
  if (!divisor) {
    // No divisor provided, so we need to calculate the default
    divisor = 0;

    // The divisor is the sum of all the values in the convolution matrix
    for (var i = 0, len = adjust.length; i < len; i++) {
      divisor += adjust[i];
    }
  }
  
  // Store all of the info for this kernel in an object for later retrieval
  var data = {
    name: name,
    adjust: adjust,
    divisor: divisor,
    bias: bias || 0
  };
  
  // Add the convolution to the render queue and move on
  this.renderQueue.push({adjust: data, processFn: Caman.processKernel, type: Caman.ProcessType.KERNEL});
  
  return this;
};

// Process an advanced plugin and add it to the render queue. Not much to do here since so much
// of the control lies with the plugin itself.
Caman.manip.processPlugin = function (plugin, args) {
  this.renderQueue.push({type: Caman.ProcessType.PLUGIN, plugin: plugin, args: args});
  return this;
};

// Executes an advanced plugin. Simply calls the plugin function while setting the context to
// the manip object.
Caman.manip.executePlugin = function (plugin, args) {
  console.log("Executing plugin: " + plugin);
  Caman.plugin[plugin].apply(this, args);
  console.log("Plugin " + plugin + " finished!");
  
  // Continue to the next rendering operation
  this.processNext();
};

// Begins the render process if it's not started, or moves to the next
// filter in the queue and processes it. Calls the finishedFn callback
// when the render queue is empty.
Caman.manip.processNext = function (finishedFn) {
  if (typeof finishedFn === "function") {
    // Since this function is indirectly recursive, it would be a pain to pass the processFn
    // around each time. Instead, we simply store it with the manip object for later usage.
    this.finishedFn = finishedFn;
  }
  
  // Rendering is complete when the render queue is empty
  if (this.renderQueue.length === 0) {
    // Trigger the render finished event
    Caman.trigger("renderFinished", {id: this.canvas_id});
    
    // If we have a render finished callback, execute it now
    if (typeof this.finishedFn === "function") {
      this.finishedFn.call(this);
    }
    
    return;
  }
  
  // Retrive the next operation from the render queue
  var next = this.renderQueue.shift();
  
  if (next.type == Caman.ProcessType.LAYER_DEQUEUE) {
    // New layer operative. Shift the next layer off the canvas queue and execute 
    // it's transformations.
    var layer = this.canvasQueue.shift();
    this.executeLayer(layer);
    
  } else if (next.type == Caman.ProcessType.LAYER_FINISHED) {
    // Layer is finished rendering. Blend it with the parent layer, change context back to
    // the parent layer, and move onto the next operation.
    this.applyCurrentLayer();
    this.popContext();
    this.processNext();
    
  } else if (next.type == Caman.ProcessType.LOAD_OVERLAY) {
    // Load an image to be used as a layer overlay.
    this.loadOverlay(next.layer, next.src);
    
  } else if (next.type == Caman.ProcessType.PLUGIN) {
    
    // Execute an advanced plugin
    this.executePlugin(next.plugin, next.args);
    
  } else {
    // Execute a normal pixel-wise filter and apply it to the current layer/canvas
    this.executeFilter(next.adjust, next.processFn, next.type);
  }
};

Caman.extend( Caman, {  
  // Convolution kernel rendering. Given an array of pixels based on the current location in the
  // rendering process, and a convolution matrix, calculate the new value of the kernel.
  processKernel: function (adjust, kernel, divisor, bias) {
    var val = {r: 0, g: 0, b: 0};
    
    // Loop through each pixel in the kernel and apply it to the matching pixel in the matrix
    // from the image.
    for (var i = 0, len = adjust.length; i < len; i++) {
      val.r += adjust[i] * kernel[i * 3];
      val.g += adjust[i] * kernel[i * 3 + 1];
      val.b += adjust[i] * kernel[i * 3 + 2];
    }
    
    // Finally, apply the divisor and the bias to the calculated kernel
    val.r = (val.r / divisor) + bias;
    val.g = (val.g / divisor) + bias;
    val.b = (val.b / divisor) + bias;

    return val;
  }
});

// The core of the image rendering, this function executes
// the provided filter and updates the canvas pixel data
// accordingly.
//
// NOTE: this does not write the updated pixel
// data to the canvas. That happens when all filters are finished
// rendering in order to be as fast as possible.
Caman.manip.executeFilter = function (adjust, processFn, type) {
  // Shortcut to the length of the pixel array
  var n = this.pixel_data.length,
  
  // (n/4) == # of pixels in image
  // Give remaining pixels to last block in case it doesn't
  // divide evenly.
  blockPixelLength = Math.floor((n / 4) / Caman.renderBlocks),
  
  // expand it again to make the loop easier.
  blockN = blockPixelLength * 4,
  
  // add the remainder pixels to the last block.
  lastBlockN = blockN + ((n / 4) % Caman.renderBlocks) * 4,

  // Stupid context proxying >.>
  self = this,
  
  // Keep track of how many blocks are done so we know when rendering finishes
  blocks_done = 0,
  
  // Called whenever a block finishes. It's used to determine when all blocks
  // finish rendering.
  block_finished = function (bnum) {
    if (bnum >= 0) {
      console.log("Block #" + bnum + " finished! Filter: " + processFn.name);
    }
    
    blocks_done++;

    // All blocks finished rendering
    if (blocks_done == Caman.renderBlocks || bnum == -1) {
      if (bnum >= 0) {
        console.log("Filter " + processFn.name + " finished!");
      } else {
        // Due to the nature of convolution, it does not divide the image into blocks
        console.log("Kernel filter finished!");
      }
      
      Caman.trigger("processComplete", {id: self.canvas_id, completed: processFn.name});
      
      // Since this filter is finished, it's time to move on to the next render operation
      self.processNext();
    }
  },
  
  //Renders a block of the image bounded by the start and end parameters.
  render_block = function (bnum, start, end) {
    console.log("BLOCK #" + bnum + " - Filter: " + processFn.name + ", Start: " + start + ", End: " + end);
    
    var renderFunc = function () {
      // Create an RGB object to pass to the filter functions
      var data = {r: 0, g: 0, b: 0, a: 0};
      
      // Prepare the PixelInfo object
      var pixelInfo = new this.pixelInfo(self);
      var res;
      
      for (var i = start; i < end; i += 4) {
        // Set the location of the pixelInfo object to the current pixel
        pixelInfo.loc = i;
        
        // Update the values of the RGB object
        data.r = this.pixel_data[i];
        data.g = this.pixel_data[i+1];
        data.b = this.pixel_data[i+2];
        
        // Execute the filter!
        res = processFn.call(pixelInfo, adjust, data);
        
        // Apply the modified RGB object to the current pixel array. These values are automatically clamped in
        // order to conform to the latest canvas spec.
        this.pixel_data[i]   = Caman.clampRGB(res.r);
        this.pixel_data[i+1] = Caman.clampRGB(res.g);
        this.pixel_data[i+2] = Caman.clampRGB(res.b);
      }
      
      // Signal that this block is finished rendering
      block_finished(bnum);
    }.bind(this);
    
    // Begin rendering asynchronously
    setTimeout(renderFunc, 0);
  },
  
  // Renders a convolution matrix. This is admittedly confusing, especially since it was designed with
  // flexibility in mind. Bear with me here.
  render_kernel = function () {
  
    // Function that executes the rendering process
    var renderFunc = function () {
      var kernel = [],
      pixelInfo, pixel,
      start, end, 
      mod_pixel_data,
      name = adjust.name,
      bias = adjust.bias,
      divisor = adjust.divisor,
      adjustSize,
      builder, builder_index,
      i, j, k, res;
      
      // Simple shortcut
      adjust = adjust.adjust;
      
      // The size of one side of the convolutinon matrix is simply the square root (matrix must be square)
      adjustSize = Math.sqrt(adjust.length);
      
      // Will store the modified pixel data since we can't directly update the original pixel array while
      // simultaneously modifing it.
      mod_pixel_data = [];
      
      console.log("Rendering kernel - Filter: " + name);
      
      // Calculate the beginning and end of the pixel array loop
      start = self.dimensions.width * 4 * ((adjustSize - 1) / 2);
      end = n - (self.dimensions.width * 4 * ((adjustSize - 1) / 2));
      
      // Calculate the index for the kernel we're going to generate for the current pixel. This is where it
      // begins to get confusing.
      builder = (adjustSize - 1) / 2;
      
      // Set our pixelInfo object so we can easily grab pixels for the kernel.
      pixelInfo = new self.pixelInfo(self);
      
      for (i = start; i < end; i += 4) {
        pixelInfo.loc = i;
        
        builder_index = 0;

        // This generates the kernel for the current pixel based on the size of the provided convolution matrix.
        for (j = -builder; j <= builder; j++) {
          for (k = builder; k >= -builder; k--) {
            pixel = pixelInfo.getPixelRelative(j, k);
            kernel[builder_index * 3]     = pixel.r;
            kernel[builder_index * 3 + 1] = pixel.g;
            kernel[builder_index * 3 + 2] = pixel.b;
            
            builder_index++;
          }
        }
                
        // Execute the kernel processing function
        res = processFn.call(pixelInfo, adjust, kernel, divisor, bias);

        // Update the new pixel array since we can't modify the original
        // until the convolutions are finished on the entire image.
        mod_pixel_data[i]   = Caman.clampRGB(res.r);
        mod_pixel_data[i+1] = Caman.clampRGB(res.g);
        mod_pixel_data[i+2] = Caman.clampRGB(res.b);
        mod_pixel_data[i+3] = 255;
      }

      // Update the actual canvas pixel data. Unfortunately we have to set
      // this one by one or else it won't work properly.
      for (i = start; i < end; i++) {
        self.pixel_data[i] = mod_pixel_data[i];
      }
      
      // Signal that the kernel is done rendering.
      block_finished(-1);
      
    }.bind(this);
    
    // Begin rendering the kernel asychronously
    setTimeout(renderFunc, 0);
  };
  
  Caman.trigger("processStart", {id: this.canvas_id, start: processFn.name});
  
  // Decide which type of filter we have to render.
  if (type === Caman.ProcessType.SINGLE) {
    // Split the image into its blocks.
    for (var j = 0; j < Caman.renderBlocks; j++) {
      // Calculate the start and end for this image block.
      var start = j * blockN,
      
      // If this is the last block and there is some remainder, add it here.
      end = start + ((j == Caman.renderBlocks - 1) ? lastBlockN : blockN);
      
      // Begin rendering
      render_block.call(this, j, start, end);
    }
  } else {
    // Render the kernel
    render_kernel.call(this);
  }
};

Caman.extend(Caman.manip, {
  // Reverts an image back to its original state by re-initializing Caman
  revert: function (ready) {
    this.loadCanvas(this.options.image, this.options.canvas, ready);
  },
  
  // The render function that the user uses in order to begin the rendering process.
  // Once all the rendering is complete, it applies the updated pixel data to the canvas
  // and calls the finished callback (if any).
  render: function (callback) {
    this.processNext(function () {
      this.context.putImageData(this.image_data, 0, 0);
      
      if (typeof callback === 'function') {
        callback.call(this);
      }
    });    
  }
});

}(Caman));