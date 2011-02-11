/*
 * NodeJS compatibility
 */
if (!Caman) {
	var Caman = {manip:{}};
	exports.plugins = Caman.manip;
}

(function (Caman) {
  
  Caman.manip.vignette = function (size, strength) {
    var center, start, end, loc, dist, div, bezier;
    
    if (!strength) {
      strength = .6;
    } else {
      strength /= 100;
    }
    
    center = [(this.dimensions.width / 2), (this.dimensions.height / 2)];
    
    // start = darkest part
    start = Math.sqrt(Math.pow(center[0], 2) + Math.pow(center[1], 2)); // corner to center dist
    
    // end = lightest part (0 vignette)
    end = start - size;
    
    bezier = Caman.bezier([0, 100], [20, 50], [50, 0], [100, 0]);
    
    return this.process({center: center, start: start, end: end, size: size, strength: strength, bezier: bezier}, function vignette(data, rgba) {
      // current pixel coordinates
      loc = this.locationXY();
      
      // distance between center of image and current pixel
      dist = Math.sqrt(Math.pow(loc.x - data.center[0], 2) + Math.pow(loc.y - data.center[1], 2));
      
      if (dist > data.end) {
        // % of vignette
        div = (data.bezier[100 - Math.round(((dist - data.end) / data.size) * 100)] * strength) / 100;
        
        rgba.r = rgba.r - (rgba.r * div);
        rgba.g = rgba.g - (rgba.g * div);
        rgba.b = rgba.b - (rgba.b * div);
      }
      
      return rgba;
    });
  };
}(Caman));