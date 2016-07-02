class RenderWorker {
  constructor(context, id, start, end) {
    this.context = context;
    this.id = id;
    this.start = start;
    this.end = end;
    this.pixelData = this.context.pixelData;
    this.worker = null;

    if (false && typeof window != "undefined" && window.Worker) {
      this.worker = new Worker("processor.js");
      this.worker.onmessage = this._workerFinished.bind(this);
      this.worker.postMessage({ data: this.context.imageData, start: this.start, end: this.end });
    }
  }

  process(job, finished = function () {}) {
    this.finishedCb = finished;
    
    if (this.worker) {
      this._processWithWorker(job);
    } else {
      this._processWithoutWorker(job);
    }
  }

  _processWithWorker(job) {
    this.worker.postMessage({ job: job });
  }

  _workerFinished(e) {
    this.finishedCb();
  }

  _processWithoutWorker(job) {
    setTimeout(() => {
      let processor = job.item;
      processor.setup();

      for (let i = this.start; i < this.end; i += 4) {
        processor.setPixel(i,
          this.pixelData[i],
          this.pixelData[i + 1],
          this.pixelData[i + 2],
          this.pixelData[i + 3]
        );

        processor.execute();
      }

      processor.finish();

      this.finishedCb();
    }, 0);
  }
}

export default RenderWorker;
