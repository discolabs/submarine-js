import { ApiClient } from './api_client';

export class Submarine {

  constructor(options = {}) {
    this.options = options;
    this.api = new ApiClient(options);
  }

}