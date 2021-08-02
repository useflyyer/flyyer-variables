# @flyyer/variables

Helper module to create a `schema` that enables Flyyer to display template's variables on https://flyyer.io for decks and templates.

```sh
yarn add @flyyer/variables
```

Some of our official free templates are using `@flyyer/variables`:

* 🌠 flyyer.io/@/flyyer/simple-products
  * Source-code: github.com/useflyyer/flyyer-marketplace-simpleproducts
* 🌠 flyyer.io/@/flyyer/nice-typography
  * Source-code: github.com/useflyyer/flyyer-marketplace-nicetypography
* 🌠 flyyer.io/@/flyyer/branded
  * Source-code: github.com/useflyyer/flyyer-marketplace-brand

Here is what a template with an exported `schema` looks like:

![Final result on flyyer.io dashboard](.github/assets/dashboard.png)

## Usage

```tsx
import { Variable as V, Static, Validator } from "@flyyer/variables";

/**
 * Export `const schema = V.Object({})` to make variables visible on https://flyyer.io/
 */
export const schema = V.Object({
  title: V.String({ description: "Displayed on https://flyyer.io" }),
  price: V.Optional(V.Number()),
  image: V.Optional(V.Image({
    description: "Image URL",
    examples: ["https://flyyer.io/logo.png"],
  })),
  font: V.Optional(V.Font({
    default: "Inter", // https://github.com/useflyyer/use-googlefonts
  })),
});
const validator = new Validator(schema);

// Remove line and TemplateProps<Variables> if using plain Javascript
type Variables = Static<typeof schema>;

export default function Template({ variables }: TemplateProps<Variables>) {
  if (validator.validate(variables)) {
    const title = variables["title"]; // type is `string`
    const price = variables["price"]; // type is `number | undefined`
    const image = variables["image"]; // type is `string | undefined` and has URL format.
    const font = variables["font"]; // type is `string | undefined`, use with @flyyer/use-googlefonts
    // ...
  }
}
```

## Optimistic usage

Using the same schema from the previous example, if you prefer a more optimistic validation you can use:

```ts
const {
  data: { title, price, image }
} = validator.parse(variables);

// Optimistic path but variables might not be compliant with the schema.
```

Instead of (strict validation):

```ts
if (validator.validate(variables)) {
  // Happy path with compliant variables
} else {
  // Show empty or error to the user.
}
```

## Useful types

Most common types with full flyyer.io UI support are:

* `V.String`
* `V.Integer`
* `V.Number` for floats
* `V.Boolean`
* `V.DateTime`, `V.Date`, and `V.Time` (`V.DateTime` has the best compatibility)
* `V.URL`
* `V.Image`
* `V.Font`
* `V.ColorHex`
* `V.Enum`
* `V.EnumKeys`

You should be able to cover most cases with these types.

## Provide example values

On flyyer.io many template previews are rendered using the first provided `examples` value of each property with fallback to `default`.

**🚨 The `examples` property must be an array**

```tsx
export const schema = V.Object({
  image: V.Image({ examples: ["https://flyyer.io/logo.png"] }),
});
```

## E-commerce

For E-commerce templates you probably want to display the price and currency of a product. **Currently we haven't defined a proper `V.Price` and `V.Currency` methods yet. We recommended sticking with `price: V.Number` and `currency: V.String` until we have enough information to create those methods.**

> Production example: https://github.com/useflyyer/flyyer-marketplace-simpleproducts

Example:

```tsx
import { Variable as V, Validator } from '@flyyer/variables';

export const schema = V.Object({
  currency: V.Optional(
    V.String({ default: 'USD', examples: ['USD', 'EUR'] }),
  ),
  price: V.Optional(
    V.Number({ examples: ['59.99'] }),
  ),
});
const validator = new Validator(schema);

// props are provided by our systems
export default function Template({ variables, locale }) {
  const {
    data: {
      currency, // type is `string | undefined`
      price, // type is `number | undefined`
    }
  } = validator.parse(variables);

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  });

  if (Number.isFinite(price) && price === 0) {
    return <p>Free</p>;
  } else (Number.isFinite(price)) {
    return <p>{formatter.format(price)}</p>
  } else {
    return null; // Do not display price if user sets input to null or blank,
  }
}
```

## Enums

TypeScript has the `enum` type. This library can create a schema for these enums based on their _keys_ or their _values_.

* Create enum schema with keys: `V.EnumKeys`
* Create enum schema with values: `V.Enum`

```ts
enum Alignment {
  Y = "flex flex-col justify-center",
  X = "flex flex-row justify-center",
}
const schema = V.Object({
  keys: V.EnumKeys(Alignment, { default: "X" }),
  values: V.Enum(Alignment, { default: Alignment.X }),
});
```

What is the difference? If you want to display the enum's key on the UI at flyyer.io you should use `V.EnumKeys` which is more clear to the user.

```ts
// Let the user pick between "X" or "Y" on flyyer.io UI.
const schema = V.Object({
  alignment: V.EnumKeys(Alignment, { default: "X" }),
});
```

## Recommendations

JSON Schemas can be super complex and allow a lot of custom settings. At Flyyer.io we recommend sticking to a simple 1-level object for the better final user experience.

```ts
// ⚠️ Works via @flyyer/flyyer and API but not handled by Flyyer.io UI (dashboard)
export const schema = V.Object({
  title: V.Object({
    text: V.String(),
    color: V.ColorHex({ default: "#FFFFFF" }),
    font: V.Font({ default: "Inter" }),
  })
});
/* https://cdn.flyyer.io/render/v2/tenant/deck/template?title[text]=Hello&title[font]=Roboto */
/* https://cdn.flyyer.io/v2/project/_/title[text]=Hello&title[font]=Roboto/path */

// ✅ Recommended! works via @flyyer/flyyer, API, and Flyyer.io UI (dashboard)
export const schema = V.Object({
  title: V.String(),
  titleColor: V.ColorHex({ default: "#FFFFFF" }),
  titleFont: V.Font({ default: "Inter" }),
});
/* https://cdn.flyyer.io/render/v2/tenant/deck/template?title=Hello&titleFont=Roboto */
/* https://cdn.flyyer.io/v2/project/_/title=Hello&titleFont=Roboto/path */
// It also produces shorter URLs to generate images which is good.
```

---

Credits to https://github.com/sinclairzx81/typebox to enable creating a JSON Schema with an amazing developer experience.
