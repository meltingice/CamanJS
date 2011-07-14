// As the name suggests, this piece of code is responsible for handling saving and exporting images from the 
// Caman-initialized canvas element.
//
// The save() function prompts the user to download the image. The toImage() function simply converts the 
// canvas element back into an image element. Once this happens, Caman needs to be re-initialized in order 
// to edit the image further. toBase64() is simply a helper that converts the canvas data to a base64 representation.

/*global Caman: true */ 
(function (Caman) {

// Path to the remote image proxy, if any.
Caman.remoteProxy = "";

Caman.extend(Caman.manip, {
  // Grabs the canvas data, encodes it to Base64, then sets the browser location to the encoded data so that
  // the user will be prompted to download it.
  save: function (type) {
    if (type) {
      // Force filetype to lowercase for consistency
      type = type.toLowerCase();
    }
    
    // If no valid type is given, default to PNG
    if (!type || (type !== 'png' && type !== 'jpg')) {
      type = 'png';
    }
    
    // Redirect to a URL containing the base64 image data, which should (in most cases) cause the browser
    // to prompt the user with a download.
    document.location.href = this.toBase64(type).replace("image/" + type, "image/octet-stream");
  },
  
  // Takes the current canvas data, converts it to Base64, then sets it as the source of a new Image object
  // and returns it.
  toImage: function (type) {
    var img;
    
    img = document.createElement('img');
    img.src = this.toBase64(type);
    
    return img;
  },
  
  // Grabs the current canvas data and Base64 encodes it.
  toBase64: function (type) {
    if (type) {
      type = type.toLowerCase();
    }
    
    if (!type || (type !== 'png' && type !== 'jpg')) {
      type = 'png';
    }
    
    return this.canvas.toDataURL("image/" + type);
  }
});

}(Caman));