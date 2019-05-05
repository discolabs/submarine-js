import { ApiClient } from "./api_client/api_client";

export class Submarine {

  constructor(options = {}) {
    this.api = new ApiClient(options.api_url, options.authentication, options.context);
  }

}
