/*
 * CamanJS's rendering system. This covers convolution kernels,
 * pixel-wise filters, and plugins. All of the actual pixel/image
 * manipulation is executed here when render() is called.
 */
 
(function (Caman) {

Caman.renderBlocks = 4;

/*
 * SINGLE = traverse the image 1 pixel at a time
 * KERNEL = traverse the image using convolution kernels
 * LAYER_DEQUEUE = shift a layer off the canvasQueue
 * LAYER_FINISHED = finished processing a layer
 * LOAD_OVERLAY = load a local/remote image into the layer canvas
 * PLUGIN = executes a plugin function that isn't pixelwise or kernel
 */
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

Caman.manip.processKernel = function (name, adjust, divisor, bias) {  
  if (!divisor) {
    divisor = 0;

    for (var i = 0, len = adjust.length; i < len; i++) {
      divisor += adjust[i];
    }
  }
  
  var data = {
    name: name,
    adjust: adjust,
    divisor: divisor,
    bias: bias || 0
  };
  
  this.renderQueue.push({adjust: data, processFn: Caman.processKernel, type: Caman.ProcessType.KERNEL});
  
  return this;
};

Caman.manip.processPlugin = function (plugin, args) {
  this.renderQueue.push({type: Caman.ProcessType.PLUGIN, plugin: plugin, args: args});
  return this;
};

Caman.manip.executePlugin = function (plugin, args) {
  console.log("Executing plugin: " + plugin);
  Caman.plugin[plugin].apply(this, args);
  console.log("Plugin " + plugin + " finished!");
  this.processNext();
};

/*
 * Begins the render process if it's not started, or moves to the next
 * filter in the queue and processes it. Calls the finishedFn callback
 * when the render queue is empty.
 */
Caman.manip.processNext = function (finishedFn) {
  if (typeof finishedFn === "function") {
    this.finishedFn = finishedFn;
  }
  
  if (this.renderQueue.length === 0) {
    Caman.trigger("renderFinished", {id: this.canvas_id});
    
    if (typeof this.finishedFn === "function") {
      this.finishedFn.call(this);
    }
    
    return;
  }
  
  var next = this.renderQueue.shift();
  
  if (next.type == Caman.ProcessType.LAYER_DEQUEUE) {
    var layer = this.canvasQueue.shift();
    this.executeLayer(layer);
  } else if (next.type == Caman.ProcessType.LAYER_FINISHED) {
    this.applyCurrentLayer();
    this.popContext();
    this.processNext();
  } else if (next.type == Caman.ProcessType.LOAD_OVERLAY) {
    this.loadOverlay(next.layer, next.src);
  } else if (next.type == Caman.ProcessType.PLUGIN) {
    this.executePlugin(next.plugin, next.args);
  } else {
    this.executeFilter(next.adjust, next.processFn, next.type);
  }
};

/*
 * Convolution kernel processing
 */
Caman.extend( Caman, {  
  processKernel: function (adjust, kernel, divisor, bias) {
    var val = {r: 0, g: 0, b: 0};
    
    for (var i = 0, len = adjust.length; i < len; i++) {
      val.r += adjust[i] * kernel[i * 3];
      val.g += adjust[i] * kernel[i * 3 + 1];
      val.b += adjust[i] * kernel[i * 3 + 2];
    }
    
    val.r = (val.r / divisor) + bias;
    val.g = (val.g / divisor) + bias;
    val.b = (val.b / divisor) + bias;

    return val;
  }
});

/*
 * The core of the image rendering, this function executes
 * the provided filter and updates the canvas pixel data
 * accordingly. NOTE: this does not write the updated pixel
 * data to the canvas. That happens when all filters are finished
 * rendering in order to be as fast as possible.
 */
Caman.manip.executeFilter = function (adjust, processFn, type) {
  var n = this.pixel_data.length,
  res = null,
  
  // (n/4) == # of pixels in image
  // Give remaining pixels to last block in case it doesn't
  // divide evenly.
  blockPixelLength = Math.floor((n / 4) / Caman.renderBlocks),
  
  // expand it again to make the loop easier.
  blockN = blockPixelLength * 4,
  
  // add the remainder pixels to the last block.
  lastBlockN = blockN + ((n / 4) % Caman.renderBlocks) * 4,

  self = this,
  
  blocks_done = 0,
  
  // Called whenever a block finishes. It's used to determine when all blocks
  // finish rendering.
  block_finished = function (bnum) {
    if (bnum >= 0) {
      console.log("Block #" + bnum + " finished! Filter: " + processFn.name);
    }
    
    blocks_done++;

    if (blocks_done == Caman.renderBlocks || bnum == -1) {
      if (bnum >= 0) {
        console.log("Filter " + processFn.name + " finished!");
      } else {
        console.log("Kernel filter finished!");
      }
      
      Caman.trigger("processComplete", {id: self.canvas_id, completed: processFn.name});
      
      self.processNext();
    }
  },
  
  /*
   * Renders a block of the image bounded by the start and end
   * parameters.
   */
  render_block = function (bnum, start, end) {
    console.log("BLOCK #" + bnum + " - Filter: " + processFn.name + ", Start: " + start + ", End: " + end);
    
    setTimeout(function () {
      var data = {r: 0, g: 0, b: 0, a: 0};
      var pixelInfo = new self.pixelInfo(self);
      
      for (var i = start; i < end; i += 4) {
        pixelInfo.loc = i;
        data.r = self.pixel_data[i];
        data.g = self.pixel_data[i+1];
        data.b = self.pixel_data[i+2];
        data.a = self.pixel_data[i+3];
        
        res = processFn.call(pixelInfo, adjust, data);
        
        self.pixel_data[i]   = res.r;
        self.pixel_data[i+1] = res.g;
        self.pixel_data[i+2] = res.b;
        self.pixel_data[i+3] = res.a;
      }
      
      block_finished(bnum);
    }, 0);
  },
  
  render_kernel = function () {
    setTimeout(function () {
      var kernel = [],
      pixelInfo, pixel,
      start, end, 
      mod_pixel_data,
      name = adjust.name,
      bias = adjust.bias,
      divisor = adjust.divisor,
      adjustSize,
      builder, builder_index,
      i, j, k;
      
      adjust = adjust.adjust;
      adjustSize = Math.sqrt(adjust.length);
      
      mod_pixel_data = [];
      
      console.log("Rendering kernel - Filter: " + name);
      
      start = self.dimensions.width * 4 * ((adjustSize - 1) / 2);
      end = n - (self.dimensions.width * 4 * ((adjustSize - 1) / 2));
      
      builder = (adjustSize - 1) / 2;
      pixelInfo = new self.pixelInfo(self);
      
      for (i = start; i < end; i += 4) {
        pixelInfo.loc = i;
        
        builder_index = 0;
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
        mod_pixel_data[i]   = res.r;
        mod_pixel_data[i+1] = res.g;
        mod_pixel_data[i+2] = res.b;
        mod_pixel_data[i+3] = 255;
      }

      // Update the actual canvas pixel data. Unfortunately we have to set
      // this one by one.
      for (i = start; i < end; i++) {
        self.pixel_data[i] = mod_pixel_data[i];
      }
      
      block_finished(-1);
      
    }, 0);
  };
  
  Caman.trigger("processStart", {id: this.canvas_id, start: processFn.name});
  
  if (type === Caman.ProcessType.SINGLE) {
    // Split the image into its blocks.
    for (var j = 0; j < Caman.renderBlocks; j++) {
     var start = j * blockN,
     end = start + ((j == Caman.renderBlocks - 1) ? lastBlockN : blockN);
     render_block(j, start, end);
    }
  } else {
    render_kernel();
  }
};

Caman.extend(Caman.manip, {
  revert: function (ready) {
    this.loadCanvas(this.options.image, this.options.canvas, ready);
  },
  
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