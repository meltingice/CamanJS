/*
 * Input/output functions for CamanJS. Mostly deal with
 * saving images, converting them to base64, and so on.
 */
 
(function (Caman) {

Caman.remoteProxy = "";

Caman.extend(Caman.manip, {
  /*
   * Grabs the canvas data, encodes it to Base64, then
   * sets the browser location to the encoded data so that
   * the user will be prompted to download it.
   */
  save: function (file, overwrite) {
    var out = fs.createWriteStream(file),
    stream = this.canvas.createPNGStream();
    
    var stats = fs.statSync(file);
    if (stats.isFile() && !overwrite) {
      return false;
    }

    stream.on('data', function (chunk) {
      out.write(chunk);
    });
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