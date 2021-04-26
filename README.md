# @flayyer/variables

Helper module to create a `schema` that enables Flayyer to display template's variables on https://flayyer.com for decks and templates.

```sh
yarn add @flayyer/variables
```

```tsx
import { Variable as V, AsVariables } from "@flayyer/variables";

/**
 * Export `getFlayyerSchema` to make variables visible on https://flayyer.com/
 */
export const getFlayyerSchema = () => {
  const schema = V.Object({
    title: V.String({ description: "Displayed on https://flayyer.com" }),
    description: V.Optional(V.String()),
    image: V.Optional(V.String({
      description: "Image URL",
      contentMediaType: "image/*",
      examples: ["https://flayyer.com/logo.png"],
    })),
  });
  return { schema };
}

type Variables = AsVariables<typeof getFlayyerSchema>;

export default function Template(props: TemplateProps<Variables>) {
  const title = props.variables["title"];
  const description = props.variables["description"];
  const image = props.variables["image"];
  // ...
}
```

Credits to https://github.com/sinclairzx81/typebox to enable creating a JSON Schema with an amazing developer experience.
