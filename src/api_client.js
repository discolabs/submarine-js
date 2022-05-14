import { Store } from 'json-api-models';

// Constants for possible HTTP methods.
const GET = 'get';
const POST = 'post';
const PUT = 'put';
const DELETE = 'delete';

// Constants for Submarine API endpoints across environments.
const API_ENDPOINTS = {
  production: 'https://submarine.discolabs.com/api/v1',
  staging: 'https://submarine-staging.discolabs.com/api/v1',
  uat: 'https://submarine-uat.discolabs.com/api/v1',
};

// Definition of all possible API calls and their method and path.
const API_METHODS = {
  get_payment_methods: {
    http_method: GET,
    endpoint: '/customers/{{ customer_id }}/payment_methods.json'
  },
  create_payment_method: {
    http_method: POST,
    endpoint: '/customers/{{ customer_id }}/payment_methods.json'
  },
  remove_payment_method: {
    http_method: DELETE,
    endpoint: '/customers/{{ customer_id }}/payment_methods/{{ id }}.json'
  },
  get_subscriptions: {
    http_method: GET,
    endpoint: '/customers/{{ customer_id }}/subscriptions.json'
  },
  duplicate_subscription: {
    http_method: POST,
    endpoint: '/customers/{{ customer_id }}/subscriptions/{{ id }}/duplicate.json'
  },
  update_subscription: {
    http_method: PUT,
    endpoint: '/customers/{{ customer_id }}/subscriptions/{{ id }}.json'
  },
  bulk_update_subscriptions: {
    http_method: POST,
    endpoint: '/customers/{{ customer_id }}/subscriptions/bulk_update.json'
  },
  cancel_subscription: {
    http_method: DELETE,
    endpoint: '/customers/{{ customer_id }}/subscriptions/{{ id }}.json'
  },
  get_products: {
    http_method: GET,
    endpoint: '/products.json'
  },
  generate_payment_processor_client_token: {
    http_method: POST,
    endpoint: '/payment_processor_client_tokens.json'
  },
  create_preliminary_payment_method: {
    http_method: POST,
    endpoint: '/preliminary_payment_methods.json'
  }
};

// Return the appropriate API URL for the given environment, API method and context.
const getMethodUrl = (environment, method, context) =>
  Object.entries(context).reduce((method_url, contextValue) => {
    const [k, v] = contextValue;
    return method_url.replace(new RegExp(`{{ ${k} }}`, 'g'), v);
  }, [API_ENDPOINTS[environment], API_METHODS[method].endpoint].join(''));

// Return a querystring that can be appended to an API endpoint.
const buildQueryString = params => {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return `?${queryString}`;
};

// Return the appropriate HTTP method (GET, POST, DELETE etc) for the given API method.
const getMethodHttpMethod = method => API_METHODS[method].http_method;

// Return the appropriate request payload for the given HTTP method and data.
const getMethodPayload = (http_method, data) => {
  if ([GET, DELETE].includes(http_method)) {
    return null;
  }
  return JSON.stringify(data);
};

// The API client class.
export class ApiClient {

  // Instantiate the API client from an options object.
  constructor({ authentication, environment }) {
    this.authentication = authentication;
    this.environment = environment;
    this.models = new Store();
  }

  // Execute an API request against the Submarine API.
  execute(method, data, context, callback) {
    const url = getMethodUrl(this.environment, method, context);
    const http_method = getMethodHttpMethod(method);
    const queryParams = this.buildQueryParams(http_method, data);
    const payload = getMethodPayload(http_method, data);

    return fetch(url + buildQueryString(queryParams), {
      method: http_method,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: payload
    })
      .then(response => response.json())
      .then(json => this.models.sync(json))
      .then(models => callback && callback(models));
  }

  // Build query parameters for a given request, including authentication information.
  buildQueryParams(http_method, data) {
    return http_method === GET
      ? Object.assign(this.authentication, data)
      : this.authentication;
  }

  // Get a list of payment methods for the currently authenticated customer.
  getPaymentMethods(callback) {
    const context = { ...this.authentication };

    return this.execute(
      'get_payment_methods',
      {},
      context,
      callback
    );
  }

  // Create a new payment method for the currently authenticated customer.
  createPaymentMethod(customer_payment_method, callback) {
    const context = { ...this.authentication };

    return this.execute(
      'create_payment_method',
      customer_payment_method,
      context,
      callback
    );
  }

  // Remove the specified payment method for the currently authenticated customer.
  removePaymentMethod(id, callback) {
    const context = { ...this.authentication, id };

    return this.execute(
      'remove_payment_method',
      {},
      context,
      callback
    );
  }

  // Get a list of subscriptions for the currently authenticated customer.
  getSubscriptions(callback, params = {}) {
    const context = { ...this.authentication };

    return this.execute(
      'get_subscriptions',
      { ...params },
      context,
      callback
    );
  }

  // Update the specified subscription for the currently authenticated customer.
  updateSubscription(id, subscription, callback) {
    const context = { ...this.authentication, id };

    return this.execute(
      'update_subscription',
      subscription,
      context,
      callback
    );
  }

  // Update multiple subscriptions at once for the currently authenticated customer.
  bulkUpdateSubscriptions(subscription_ids, subscription, callback) {
    const context = { ...this.authentication };

    const payload = {
      bulk_update: {
        subscription_ids,
        subscription
      }
    };

    return this.execute(
      'bulk_update_subscriptions',
      payload,
      context,
      callback
    );
  }

  // Cancel the specified subscription for the currently authenticated customer.
  cancelSubscription(id, callback) {
    const context = { ...this.authentication, id };

    return this.execute(
      'cancel_subscription',
      {},
      context,
      callback
    );
  }

  // Duplicate the specified subscription for the currently authenticated customer.
  duplicateSubscription(id, callback) {
    const context = { ...this.authentication, id };

    return this.execute(
      'duplicate_subscription',
      {},
      context,
      callback
    );
  }

  // Generate a client token for the specified payment processor.
  generatePaymentProcessorClientToken(payment_processor, callback) {
    const payload = {
      data: {
        type: 'payment_processor_client_token',
        attributes: { payment_processor }
      }
    };

    return this.execute(
      'generate_payment_processor_client_token',
      payload,
      {},
      callback
    );
  }

  // Create a preliminary payment method for an in-progress checkout.
  //
  // This method is only required during checkout and is typically invoked by Submarine's checkout
  // library - it shouldn't need to be called by partner or merchant code.
  createPreliminaryPaymentMethod(preliminary_payment_method, callback) {
    return this.execute(
      'create_preliminary_payment_method',
      preliminary_payment_method,
      {},
      callback
    );
  }
}