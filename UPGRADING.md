# Upgrading
This file contains instructions for anyone upgrading a project from one version of Submarine.js to the next.

## Upgrading from 0.3.2 to Unreleased

### Changes for Braintree hosted field widget
There were a couple of changes related to the styling of hosted fields in the Braintree credit card widget.

A merchant-specific piece of code that set the `<iframe>` Braintree field elements to a height of `44px` was removed.
Height of these elements should be controlled through CSS in the theme.

The default styling options for the hosted field inputs was tweaked a little to match Shopify's defaults, and the margin and padding values provided were removed.
Again, most margin and padding should be managed through theme CSS. Where that's not possible, you can now explicitly pass hosted field options to Submarine's options, eg:

```
window.submarineOptions = {
  submarine: {
    api_url: {{ shop.metafields.submarine.api_url | json }},
    ...
  },
  braintree: {
    hostedFieldsOptions: {
      styles: {
        input: {
          color: '#333333',
          'font-size': '14px',
          'font-family':
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
        },
        '::-webkit-input-placeholder': {
          'color': '#515151',
          'font-size': '13.33333px',
          'font-weight': '400',
          'line-height': '150%'
        }
      }
    }
  }
}
```

Note that options aren't merged, so if you're providing this option you need to provide everything, not just your customisations.

## Upgrading to 0.3.2
As this file didn't exist prior to this, no detailed upgrade notes are available.
