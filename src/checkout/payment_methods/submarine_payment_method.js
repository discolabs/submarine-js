const renderHtmlTemplate = (object, template_name, html_templates) => {
  return Object.entries(object).reduce((output, value) => {
    const [k, v] = value;
    return output.replace(new RegExp(`{{ ${k} }}`, 'g'), v);
  }, html_templates[template_name]);
};

export default class SubmarinePaymentMethod {

  constructor($, options, data) {
    this.$ = $;
    this.options = options;
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

  validate() {
    return [];
  }

  process(callbacks) {

  }

}
