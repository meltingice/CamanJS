(function (Caman) {
  
  Caman.manip.vignette = function (amt, strength) {
    var center, start, end, loc, dist, div;
    
    if (!strength) {
      strength = 0.6;
    } else {
      strength /= 100;
    }
    
    center = [(this.dimensions.width / 2), (this.dimensions.height / 2)];
    start = Math.sqrt(Math.pow(center[0], 2) + Math.pow(center[1], 2)); // corner to center dist
    end = start - amt;
    
    console.log("Start:", start);
    console.log("End:", end);
    
    return this.process({center: center, start: start, end: end, amt: amt, strength: strength}, function vignette(data, rgba) {
      loc = this.locationXY();
      dist = Math.sqrt(Math.pow(loc.x - data.center[0], 2) + Math.pow(loc.y - data.center[1], 2));
      
      if (dist > data.end) {
        div = (1 - ((start - dist) / amt)) * data.strength;
        
        rgba.r = rgba.r - (rgba.r * div);
        rgba.g = rgba.g - (rgba.g * div);
        rgba.b = rgba.b - (rgba.b * div);
      }
      
      return rgba;
    });
  };
}(Caman));