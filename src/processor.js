importScripts("caman.js");

self.onmessage = function (e) {
  switch (e.data.action) {
    case 'init': processor.init(e.data); break;
    case 'process': processor.process(e.data); break;
  }
};

var CamanProcessor = (function (Caman) {
  function CamanProcessor() {
    this.canvasData;
    this.pixelData = null;
    this.start = null;
    this.end = null;
  }

  CamanProcessor.prototype.init = function (data) {
    this.canvasData = data.data;
    this.pixelData = this.canvasData.data;
    this.start = data.start;
    this.end = data.end;
  };

  CamanProcessor.prototype.process = function (data) {

  };

  return CamanProcessor;
}(Caman.default));

var processor = new CamanProcessor();
