
export default class MyError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
