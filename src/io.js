/*
 * Input/output functions for CamanJS. Mostly deal with
 * saving images, converting them to base64, and so on.
 */

/*global Caman: true */ 
(function (Caman) {

Caman.remoteProxy = "";

Caman.extend(Caman.manip, {
  /*
   * Grabs the canvas data, encodes it to Base64, then
   * sets the browser location to the encoded data so that
   * the user will be prompted to download it.
   */
  save: function (type) {
    if (type) {
      type = type.toLowerCase();
    }
    
    if (!type || (type !== 'png' && type !== 'jpg')) {
      type = 'png';
    }
    
    document.location.href = this.toBase64(type).replace("image/" + type, "image/octet-stream");
  },
  
  /*
   * Takes the current canvas data, converts it to Base64, then
   * sets it as the source of a new Image object and returns it.
   */
  toImage: function (type) {
    var img;
    
    img = document.createElement('img');
    img.src = this.toBase64(type);
    
    return img;
  },
  
  /*
   * Grabs the current canvas data and Base64 encodes it.
   */
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