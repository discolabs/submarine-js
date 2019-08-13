const renderHtmlTemplate = (object, template_name, html_templates) => {
  return Object.entries(object).reduce((output, value) => {
    const [k, v] = value;
    return output.replace(new RegExp(`{{ ${k} }}`, 'g'), v);
  }, html_templates[template_name]);
};

/**
 * Given a translation key and a hash of translation values, return the
 * corresponding translated value with any interpolation applied, eg:
 *
 *   getTranslation(
 *     "submarine.checkout.expiry_date",
 *     {
 *       "submarine": {
 *         "checkout": {
 *           "expiry_date": "Expires {{ expiry_month }}/{{ expiry_year }}"
 *         }
 *       }
 *     }
 *   )
 *
 * returns:
 *
 *   "Expires {{ expiry_month }}/{{ expiry_year }}"
 *
 * If the translation key can't be found, this method simply returns the
 * supplied key.
 *
 * @param key
 * @param translations
 * @returns {string}
 */
const getTranslation = (key, translations = {}) => {
  let currentTranslation = translations;
  key.split('.').forEach((k) => {
    currentTranslation = currentTranslation[k];
    if(typeof currentTranslation === 'undefined') {
      return key;
    }
  });
  return currentTranslation;
};

/**
 * Given a translation key, a hash of translation values, and an (optional)
 * hash of interpolation values, return the corresponding translated value with
 * any interpolations applied, eg:
 *
 *   getInterpolatedTranslation(
 *     "submarine.checkout.expiry_date",
 *     {
 *       "submarine": {
 *         "checkout": {
 *           "expiry_date": "Expires {{ expiry_month }}/{{ expiry_year }}"
 *         }
 *       }
 *     },
 *     {
 *       "expiry_month": "05",
 *       "expiry_year": "24"
 *     }
 *   )
 *
 * returns:
 *
 *   "Expires 05/24"
 *
 * If the translation key can't be found, this method simply returns the
 * supplied key.
 *
 * @param key
 * @param translations
 * @param values
 * @returns {string}
 */
const getInterpolatedTranslation = (key, translations = {}, values = {}) => {
  return Object.entries(values).reduce((output, value) => {
    const [k, v] = value;
    return output.replace(`{{ ${k} }}`, v);
  }, getTranslation(key, translations));
};

export default class SubmarinePaymentMethod {

  constructor($, options, translations, data) {
    this.$ = $;
    this.options = options;
    this.translations = translations;
    this.data = data;
  }

  load() {
    this.beforeSetup();
    return new Promise(this.setup.bind(this));
  }

  beforeSetup() {}

  setup(success, failure) {
    success(true);
  }

  getValue() { return null; }
  getRenderContext() { return {} }
  getRenderTemplate() { return null; }

  render(html_templates, index) {
    return renderHtmlTemplate(
      Object.assign({}, this.getRenderContext(), { index: index }),
      this.getRenderTemplate(),
      html_templates
    );
  }

  t(key, values = {}) {
    return getInterpolatedTranslation(key, this.translations, values);
  }

  validate() {
    return [];
  }

  process(callbacks) {

  }

}
