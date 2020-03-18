const GET = 'get';
const POST = 'post';
const PUT = 'put';
const DELETE = 'delete';

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
    endpoint:
      '/customers/{{ customer_id }}/subscriptions/{{ id }}/duplicate.json'
  },
  update_subscription: {
    http_method: PUT,
    endpoint: '/customers/{{ customer_id }}/subscriptions/{{ id }}.json'
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

/**
 * Return the appropriate API url for the given API method and context.
 *
 * @param api_url
 * @param method
 * @param context
 * @returns {string}
 */
const getMethodUrl = (api_url, method, context) =>
  Object.entries(context).reduce((method_url, contextValue) => {
    const [k, v] = contextValue;
    return method_url.replace(new RegExp(`{{ ${k} }}`, 'g'), v);
  }, [api_url, API_METHODS[method].endpoint].join(''));

/**
 * Return a querystring that can be appended to an API endpoint.
 *
 * @params params
 * @returns {string}
 */
const buildQueryString = params => {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return `?${queryString}`;
};

/**
 * Return the appropriate HTTP method (GET, POST, DELETE etc) for the
 * given API method.
 *
 * @param method
 * @returns {string}
 */
const getMethodHttpMethod = method => API_METHODS[method].http_method;

/**
 * Return the appropriate request payload for the given HTTP method and
 * data.
 *
 * @param http_method
 * @param data
 * @returns {*}
 */
const getMethodPayload = (http_method, data) => {
  if ([GET, DELETE].includes(http_method)) {
    return null;
  }
  return JSON.stringify(data);
};

export class ApiClient {
  constructor(api_url, authentication, context) {
    this.api_url = api_url;
    this.authentication = authentication;
    this.context = context;
  }

  execute(method, data, context, callback) {
    const url = getMethodUrl(this.api_url, method, context);
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
      .then(json => {
        callback && callback(json.data);
      });
  }

  buildQueryParams(http_method, data) {
    return http_method === GET
      ? Object.assign(this.authentication, data)
      : this.authentication;
  }

  getPaymentMethods(callback) {
    return this.execute('get_payment_methods', {}, this.context, callback);
  }

  createPaymentMethod(customer_payment_method, callback) {
    return this.execute(
      'create_payment_method',
      customer_payment_method,
      this.context,
      callback
    );
  }

  removePaymentMethod(id, callback) {
    const context = { ...this.context, id };
    return this.execute('remove_payment_method', {}, context, callback);
  }

  getSubscriptions(callback, params = {}) {
    return this.execute(
      'get_subscriptions',
      { ...params },
      this.context,
      callback
    );
  }

  updateSubscription(id, subscription, callback) {
    const context = { ...this.context, id };
    return this.execute('update_subscription', subscription, context, callback);
  }

  cancelSubscription(id, callback) {
    const context = { ...this.context, id };
    return this.execute('cancel_subscription', {}, context, callback);
  }

  duplicateSubscription(id, callback) {
    const context = { ...this.context, id };
    return this.execute('duplicate_subscription', {}, context, callback);
  }

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
      this.context,
      callback
    );
  }

  createPreliminaryPaymentMethod(preliminary_payment_method, callback) {
    return this.execute(
      'create_preliminary_payment_method',
      preliminary_payment_method,
      this.context,
      callback
    );
  }
}
