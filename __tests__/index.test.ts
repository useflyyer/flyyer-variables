import { Variable as V, Static, Validator } from "../src";

describe("Validator", () => {
  const schema = V.Object({
    number: V.Optional(V.Integer({ default: 32 })),
  });

  it("infers type and coarse types (parsing)", () => {
    const validator = new Validator(schema);
    const variables: unknown = { number: "2" };
    if (validator.validate(variables)) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(variables.number === 2).toEqual(true); // No type error here ✅
    } else {
      throw new Error("Fails");
    }
  });

  it("on invalid input it keeps variable but isValid is false", () => {
    const validator = new Validator(schema);
    const variables: unknown = { number: "foo" };
    const { data, isValid } = validator.parse(variables);
    expect(isValid).toBe(false);
    expect(data).toHaveProperty("number", "foo");

    if (validator.validate(variables)) {
      throw new Error("Shouldn't be here");
    } else {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(variables).toHaveProperty("number", "foo");
    }
  });

  it("uses default value", () => {
    const validator = new Validator(schema);
    type Variables = Static<typeof schema>;
    const vars: Variables = {}; // No type error here ✅
    expect(validator.parse(vars)).toHaveProperty("data", { number: 32 });
  });
});

describe("Variable.Email", () => {
  it("produces expected string property", () => {
    const schema = V.Object({
      email: V.Email({}),
    });
    expect(schema.properties.email.format).toEqual("email");
    type Variables = Static<typeof schema>;
    const variables: Variables = {
      email: "patricio@flayyer.com",
    };
    expect(variables).toHaveProperty("email");
    const validator = new Validator(schema);
    const validated = validator.parse(variables);
    expect(validated.isValid).toBe(true);

    const invalid = validator.parse({ email: "hello world" });
    expect(invalid.isValid).toBe(false);
  });
});

describe("Variable.URL", () => {
  it("produces expected string property", () => {
    const schema = V.Object({
      url: V.URL({ description: "Just an URL" }),
    });
    expect(schema.properties.url.format).toEqual("uri-reference");
  });
});

describe("Variable.Image", () => {
  it("produces expected string property", () => {
    const schema = V.Object({
      image: V.Image({ description: "Just an image URL, on the dashboard allow file uploads" }),
    });
    expect(schema.properties.image.contentMediaType).toEqual("image/*");
    expect(schema.properties.image.format).toEqual("uri-reference");
  });
});

describe("Variable.Font", () => {
  it("produces expected string property", () => {
    const schema = V.Object({
      font: V.Font({ default: "Inter", examples: ["Roboto", "Avro"] }),
    });
    expect(schema.properties.font.contentMediaType).toEqual("font/*");
  });
});

describe("Variable.DateTime, Variable.Date, Variable.Time", () => {
  it("produces expected string property", () => {
    const schema = V.Object({
      datetime: V.DateTime(),
      date: V.Date(),
      time: V.Time(),
      optional: V.Optional(V.DateTime({ default: new Date() })),
    });
    expect(schema.properties.datetime.format).toEqual("date-time");
    type Variables = Static<typeof schema>;
    const variables: Variables = {
      datetime: new Date().toISOString(),
      date: "2021-12-30",
      time: "20:20:39+00:00",
    };
    expect(variables).toHaveProperty("datetime");
    const validator = new Validator(schema);
    const validated = validator.parse(variables);
    expect(validated.isValid).toBe(true);
    expect(typeof validated.data.datetime).toBe("string");
  });
});

describe("Schema and typing", () => {
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
          V.Image({
            description: "Image URL",
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
