import * as jsonfile from 'jsonfile';

export default class TimeBucket{
  private bucket;
  private range;
  private particle;
  private size;
  private head;
  private filePath;

  constructor(range, particle) {
      const l = range % particle;

      if (l) {
          range += (particle - l);
      }

      const bucket = [];
      this.bucket = bucket;
      this.range = range;
      this.particle = particle;
      this.size = (range / particle) + 1;

      for (let i = 0; i < this.size; i += 1) {
          bucket.push({});
      }

      this._start();
  }

  public save(){
      return new Promise((resolve, reject) => {
          const thisObj = Object.assign({}, this);
          delete thisObj.filePath;
          jsonfile.writeFile(this.filePath, thisObj, (err) => {
              if (err) {
                  reject(err);
              } else {
                  resolve();
              }
          });
      });
  }

  public load(filePath) {
      return new Promise((resolve, reject) => {
          jsonfile.readFile(filePath, (err, obj) => {
              if (err) {
                  reject(err);
              } else {
                  Object.assign(this, obj);
                  resolve();
              }
          });
      });
  }

  public get (key, range) {
      if (range == null) {
          range = this.range;
      }

      if (range > this.range) {
          throw new Error(`range must less than ${this.range}`);
      }

      const now = this.now();
      const index = this._getParticleIndex(now);
      const fromIndex = this._getParticleIndex(now - range);
      let count = 0;

      for (var i = index, particle; i >= fromIndex && i >= 0; i--) {
          particle = this._getParticle(i);
          if (particle) {
              count += particle.data[key] || 0;
          }
      }

      return count;
  }

  public put(key, value) {
      const now = this.now();
      const index = this._getParticleIndex(now);
      const particle = this._getParticle(index);

      if (particle.data[key]) {
          particle.data[key] += value;
      } else {
          particle.data[key] = value;
      }
      return this.save();
  }

  private _start() {
      this.head = this.now();
  }

  private now() {
      return new Date().getTime();
  }

  private _getParticleIndex (current) {
      return Math.floor((current - this.head) / this.particle);
  }

  private _getParticle(index) {
      const particle = this.bucket[index % this.size];
      if (particle.index !== index) {
          particle.index = index;
          particle.data = {};
      }
      return particle;
  }

  public static async newInstance(range, particle, filePath) {
      const instance = new TimeBucket(range, particle);
      instance.filePath = filePath;
      await instance.load(filePath).catch(() => {
      });
      return instance;
  }
}
