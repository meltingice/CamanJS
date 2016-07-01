class RenderWorker {
  constructor(context, id, start, end) {
    this.context = context;
    this.id = id;
    this.start = start;
    this.end = end;
    this.pixelData = this.context.pixelData;
  }

  process(job) {
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
  }
}

export default RenderWorker;
