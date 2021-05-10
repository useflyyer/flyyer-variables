import { TypeBuilder, StringKind } from "@sinclair/typebox";
import type { Static as TypeBoxStatic, TString, StringFormatOption, StringOptions } from "@sinclair/typebox";
import Ajv, { Options, Schema, ValidateFunction } from "ajv";
import addFormats, { FormatsPluginOptions } from "ajv-formats";

/**
 * Create an extended instance of AJV with better support for @flayyer/variables.
 * @see Website https://ajv.js.org/
 * @example
 * import { Variable as V, Static, Validator } from "@flayyer/validator";
 * export const schema = V.Object({
 *   number: V.Optional(V.Integer({ default: 32 })),
 * });
 * const validator = new Validator(schema);
 * validator.parse({ number: "42" }).data["number"] === 42 // true
 * validator.parse().data["number"] === 32 // true
 */
export class Validator<U extends Schema, D extends Static<U>> {
  /** Cached instance of AJV */
  public readonly ajv: Ajv;
  /** Schema key */
  public readonly key = "flayyer-variables";

  /** Default options for https://github.com/ajv-validator/ajv */
  public static DEFAULT_OPTIONS: Options = {
    coerceTypes: "array",
    strict: false,
    useDefaults: true,
    removeAdditional: true,
    allErrors: true,
  };
  /** Default options for https://github.com/ajv-validator/ajv-formats */
  public static DEFAULT_FORMATS_OPTIONS: FormatsPluginOptions = {
    mode: "fast",
  };

  public constructor(schema: U, options?: Options, formatOptions?: FormatsPluginOptions) {
    this.ajv = addFormats(
      new Ajv({
        ...Validator.DEFAULT_OPTIONS,
        ...options,
      }),
      {
        ...Validator.DEFAULT_FORMATS_OPTIONS,
        ...formatOptions,
      },
    );
    this.ajv.addKeyword("kind").addKeyword("modifier");
    this.ajv.addSchema(schema, this.key);
  }

  public getSchema() {
    const validate = this.ajv.getSchema(this.key) as ValidateFunction<D> | undefined;
    if (!validate) {
      throw new Error("Missing schema");
    }
    return validate;
  }

  /**
   * Take `variables` and apply defaults, coerce types and return a fresh copy.
   */
  public parse(variables: unknown) {
    const validate = this.getSchema();
    const cloned = JSON.parse(JSON.stringify(variables));
    const valid = validate(cloned);
    return { data: cloned as D, isValid: valid as boolean, errors: validate.errors } as const;
  }

  /**
   * Validate if `variables` respect the defined schema. Beware this mutates the object.
   *
   * This is a Type Guard, see example.
   * @example
   * import { Variable as V, Validator } from "@flayyer/variables";
   * export const schema = V.Object({ count: V.Integer({ default: 10 }) });
   * const validator = new Validator(schema);
   * export default function Template({ variables }) {
   *   const raw = variables["count"] // of type string just like "2" is a string
   *   const isValid = validator.validate(variables);
   *   if (isValid) {
   *     const number = variables["count"] // of type number, 10 if was variables were missing it.
   *   } else {
   *     // variables["count"] has an unexpected value
   *   }
   * }
   */
  public validate(variables: unknown): variables is D {
    const validate = this.getSchema();
    return validate(variables);
  }
}

// Add more formats:
// https://github.com/sinclairzx81/typebox/issues/43

// Make `examples` an array of the respective type.

export class VariableBuilder extends TypeBuilder {
  /**
   * EXTENDED: Intended for URLs. Creates a String schema with `{ format: "uri-reference" }`
   * @example
   * import { Variable as V, Validator } from "@flayyer/variables";
   * export const schema = V.Object({
   *   url: V.URL({ default: "https://flayyer.com" }),
   * });
   */
  public URL<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = "uri-reference";
    return { format, ...options, kind: StringKind, type: "string" };
  }

  /** EXTENDED: Intended for images URLs (relative or absolute). Creates a String schema with `{ format: "uri-reference", contentMediaType: "image/*" }` */
  public Image<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = "uri-reference";
    return { contentMediaType: "image/*", format, ...options, kind: StringKind, type: "string" };
  }

  /**
   * EXTENDED: Intended for fonts. Creates a String schema with `{ format: "uri-reference", contentMediaType: "font/*" }`
   * @example
   * import { Variable as V, Validator } from "@flayyer/variables";
   * export const schema = V.Object({
   *   font: V.Font({ default: "Fira Code" }),
   *   fonts: V.Array(V.Font(), { examples: [["Inter", "Roboto"]] }),
   * });
   */
  public Font<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    return { contentMediaType: "font/*", ...options, kind: StringKind, type: "string" };
  }

  /**
   * EXTENDED: Intended for Emails addresses. Creates a String schema with `{ format: "email" }`
   * @example
   * import { Variable as V, Validator } from "@flayyer/variables";
   * export const schema = V.Object({
   *   email: V.Email({ examples: ["patricio@flayyer.com"] }),
   * });
   */
  public Email<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = "email";
    return { format, ...options, kind: StringKind, type: "string" };
  }

  // TODO: Phone number and Address

  /** EXTENDED: Prefer `DateTime` for better compatibility with `Date` class */
  public Date<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = "date";
    return { format, ...options, kind: StringKind, type: "string" };
  }

  /** EXTENDED: Prefer `DateTime` for better compatibility with `Date` class */
  public Time<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = "time";
    return { format, ...options, kind: StringKind, type: "string" };
  }

  /**
   * EXTENDED: Recommended for dates and times (and date-times). Note: parsed value will be a string, not a `Date`.
   * @example
   * import { Variable as V, Validator } from "@flayyer/variables";
   * export const schema = V.Object({
   *   creation: V.DateTime({ examples: [new Date().toISOString()] })
   * });
   * const validator = new Validator(schema);
   * const parsed = validator.parse(variables);
   * const date = new Date(parsed.data["creation"]);
   */
  public DateTime<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = "date-time";
    return { format, ...options, kind: StringKind, type: "string" };
  }
}

/**
 * Extends https://github.com/sinclairzx81/typebox and add additional types. See TypeBox repository for more information.
 *
 * @example
 * import { Variable as V, Static } from "@flayyer/variables";
 * export const schema = V.Object({
 *   title: V.String({ description: "Displayed on https://flayyer.com" }),
 *   description: V.Optional(V.String()),
 *   image: V.Optional(V.String({
 *     description: "Image URL",
 *     contentMediaType: "image/*",
 *     examples: ["https://flayyer.com/logo.png"],
 *   })),
 * });
 * type Variables = Static<typeof schema>;
 * export default function Template(props: TemplateProps<Variables>) {
 *   const title = props.variables["title"];
 *   const description = props.variables["description"];
 * }
 */
export const Variable = new VariableBuilder();

/**
 * @example
 * import { Variable as V, Static } from "@flayyer/variables";
 * export const schema = V.Object({
 *   title: V.String({ description: "Displayed on https://flayyer.com" }),
 *   description: V.Optional(V.String()),
 *   image: V.Optional(
 *     V.String({
 *       description: "Image URL",
 *       contentMediaType: "image/*",
 *       examples: ["https://flayyer.com/logo.png"],
 *     }),
 *   ),
 * });
 * type Variables = Static<typeof schema>;
 * export default function Template(props: TemplateProps<Variables>) {
 *   const { title, description, image } = props.variables;
 *   // ...
 * }
 */
export type Static<T> = TypeBoxStatic<T>;
