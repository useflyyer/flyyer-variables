# @flayyer/variables

Helper module to create a `schema` that enables Flayyer to display template's variables on https://flayyer.com for decks and templates.

```sh
yarn add @flayyer/variables
```

Here is what a template with an exported `schema` looks like:

![Final result on flayyer.com dashboard](.github/assets/dashboard.png)

## Usage

```tsx
import { Variable as V, Static, Validator } from "@flayyer/variables";

/**
 * Export `const schema = V.Object({})` to make variables visible on https://flayyer.com/
 */
export const schema = V.Object({
  title: V.String({ description: "Displayed on https://flayyer.com" }),
  description: V.Optional(V.String()),
  image: V.Optional(V.Image({
    description: "Image URL",
    examples: ["https://flayyer.com/logo.png"],
  })),
  font: V.Optional(V.Font({
    default: "Inter", // https://github.com/flayyer/use-googlefonts
  })),
});
const validator = new Validator(schema);

// Remove line and TemplateProps<Variables> if using plain Javascript
type Variables = Static<typeof schema>;

export default function Template({ variables }: TemplateProps<Variables>) {
  if (validator.validate(variables)) {
    const title = variables["title"];
    const description = variables["description"];
    const image = variables["image"];
    // ...
  }
}
```

## Optimistic usage

Using the same schema from the previous example, if you prefer a more optimistic validation you can use:

```ts
const {
  data: { image, description, image }
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

Most common types with full Flayyer.com UI support are:

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

What is the difference? If you want to display the enum's key on the UI at Flayyer.com you should use `V.EnumKeys` which is more clear to the user.

```ts
// Let the user pick between "X" or "Y" on Flayyer.com UI.
const schema = V.Object({
  alignment: V.EnumKeys(Alignment, { default: "X" }),
});
```

## Recommendations

JSON Schemas can be super complex and allow a lot of custom settings. In Flayyer.com we recommend sticking to a simple 1-level object for the better final user experience.

```ts
// ⚠️ Works via @flayyer/flayyer and code but not handled by Flayyer.com UI
export const schema = V.Object({
  title: V.Object({
    text: V.String(),
    color: V.ColorHex({ default: "#FFFFFF" }),
    font: V.Font({ default: "Inter" }),
  })
});
/* https://flayyer.io/v2/tenant/deck/template?title[text]=Hello&title[font]=Roboto */
/* https://flayyer.ai/v2/project/_/title[text]=Hello&title[font]=Roboto/path */

// ✅ Recommended! works via @flayyer/flayyer and Flayyer.com UI
export const schema = V.Object({
  title: V.String(),
  titleColor: V.ColorHex({ default: "#FFFFFF" }),
  titleFont: V.Font({ default: "Inter" }),
});
/* https://flayyer.io/v2/tenant/deck/template?title=Hello&titleFont=Roboto */
/* https://flayyer.ai/v2/project/_/title=Hello&titleFont=Roboto/path */
// It also requires shorter URLs to generate images.
```

---

Credits to https://github.com/sinclairzx81/typebox to enable creating a JSON Schema with an amazing developer experience.
