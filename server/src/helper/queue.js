const EventEmitter = require('events');

class Queue extends EventEmitter {
  constructor(id, opts = {}) {
    super();

    // validate params
    if (typeof id !== 'string') throw new Error('ID must be a string');
    if (typeof opts !== 'object') throw new Error('Options must be an object');

    // maximum 5 concurrent jobs, default 3 concurrent jobs
    if (
      (opts.concurrency && typeof opts.concurrency !== 'number') ||
      !opts.concurrency ||
      opts.concurrency < 1 ||
      opts.concurrency > 5
    ) {
      opts.concurrency = 3;
    }

    if (!(opts.notifier instanceof EventEmitter)) {
      throw new Error('opts.notifier must be an instance of EventEmitter');
    }

    this.id = id;
    this.pending = [];
    this.processing = new Map();
    this.concurrency = opts.concurrency;
    this.notifier = opts.notifier;

    const listener = () => {
      if (this.processing.size < this.concurrency && this.pending.length > 0) {
        // remove the oldest job from pending
        const job = this.pending.shift();

        // add to processing
        this.processing.set(job.id, job);
        this.notifier.emit('queue:jobProcessing', job.data);
        this.emit('queue:jobProcessing', job.id);

        // call its handler function
        job
          .handler(job.data, this.notifier)
          .then(() => {
            // job is done, remove from processing
            this.processing.delete(job.id);
            this.notifier.emit('queue:jobDone', job.data);
            this.emit('queue:jobDone', job.id);

            if (this.processing.size + this.pending.length === 0) {
              this.notifier.emit('queue:empty');
              this.emit('queue:empty');
            }
          })
          .catch(err => {
            // job is failed, remove from processing
            this.processing.delete(job.id);
            if (job.retryTimes > 0) {
              // add it back to pending with retryTimes decreased
              this.notifier.emit('queue:jobRetry', job.data);
              this.emit('queue:jobRetry', job.id);
              this.add({ ...job, retryTimes: --job.retryTimes });
            } else {
              // stop retrying and admit its failure
              this.notifier.emit('queue:jobFailed', job.data);
              this.emit('queue:jobFailed', job.id);
            }
            console.error(`queue:${this.id}`, err);
          });
      }
    };

    this.on('queue:newPendingJob', listener);
    this.on('queue:jobDone', listener);
  }

  add(job = {}) {
    // validate schema
    if (
      typeof job !== 'object' ||
      typeof job.id !== 'string' ||
      typeof job.data !== 'object' ||
      typeof job.handler !== 'function'
    ) {
      throw new Error('Job object has invalid schema');
    }

    job.retryTimes = job.retryTimes || 0;

    // 0 equals no retry, maximum 5 retries
    if (job.retryTimes < 0) job.retryTimes = 0;
    if (job.retryTimes > 5) job.retryTimes = 5;

    // push job to pending
    this.pending.push(job);
    this.notifier.emit('queue:newPendingJob', job.data);
    this.emit('queue:newPendingJob', job.id);
  }
}

module.exports = Queue;
