// import { TemplateProps } from "@flayyer/flayyer-types";

import { Variable as V, Static } from "../src";

describe("Variable", () => {
  it("produces JSON Schema output", () => {
    const flayyerTypes = V.Object({
      title: V.String({ description: "Show this on https://flayyer.com" }),
      count: V.Integer({ title: "Count of items" }),
      price: V.Number({ default: 10.0, examples: [0.0, 4.99] }),
      createdAt: V.Optional(V.String({ format: "date-time" })),
      object: V.Object({
        name: V.String(),
        age: V.Integer(),
      }),
      array: V.Array(V.Number(), { description: "An array of numbers" }),
    });

    type Variables = Static<typeof flayyerTypes>;
    const variables: Variables = {
      title: "Title",
      count: 12,
      price: 99.9,
      array: [2],
      object: {
        name: "Patricio",
        age: 27,
      },
    };
    expect(variables).toHaveProperty("title", "Title");

    expect(flayyerTypes).toMatchObject({
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          description: "Show this on https://flayyer.com",
          // kind: Symbol(StringKind),
          type: "string",
        },
        price: {
          default: 10,
          examples: [0.0, 4.99],
          // kind: Symbol(NumberKind),
          type: "number",
        },
        array: {
          description: "An array of numbers",
          // kind: Symbol(ArrayKind),
          type: "array",
          items: { type: "number" },
        },
      },
    });
  });

  it("infers type on async function", () => {
    const schema = V.Strict(
      V.Object({
        title: V.String({ description: "Displayed on https://flayyer.com" }),
        description: V.Optional(V.String()),
        image: V.Optional(
          V.String({
            description: "Image URL",
            contentMediaType: "image/*",
            examples: ["https://flayyer.com/logo.png"],
          }),
        ),
      }),
    );
    type Variables = Static<typeof schema>;

    const variables: Variables = {
      title: "Title",
    };
    expect(variables).toHaveProperty("title", "Title");
  });

  it("infers type on sync function", () => {
    const schema = V.Object({
      title: V.String({ description: "Displayed on https://flayyer.com" }),
      description: V.Optional(V.String()),
      image: V.Optional(
        V.String({
          description: "Image URL",
          contentMediaType: "image/*",
          examples: ["https://flayyer.com/logo.png"],
        }),
      ),
    });
    type Variables = Static<typeof schema>;

    const variables: Variables = {
      title: "Title",
    };
    expect(variables).toHaveProperty("title", "Title");
  });
});
