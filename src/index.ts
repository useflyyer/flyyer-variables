import {
  CustomOptions,
  EnumKind,
  Static as TypeBoxStatic,
  StringFormatOption as StringFormatOptionBase,
  StringKind,
  StringOptions,
  TEnum,
  TEnumType,
  TNull,
  TSchema,
  TString,
  TUnion,
  TypeBuilder,
} from "@sinclair/typebox";
import Ajv, { Options, Schema, ValidateFunction } from "ajv";
import addFormats, { FormatsPluginOptions } from "ajv-formats";

/**
 * @example
 * import { Variable as V, Static } from "@flyyer/variables";
 * export const schema = V.Object({
 *   title: V.String({ description: "Displayed on https://flyyer.io" }),
 *   description: V.Optional(V.String()),
 *   image: V.Optional(
 *     V.Image({
 *       description: "Image URL",
 *       examples: ["https://flyyer.io/logo.png"],
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

/**
 * Overrides default formats and add custom values.
 */
export type StringFormatOption =
  // Base formats
  | StringFormatOptionBase
  // Non-standard definition same as VSCode
  | "color-hex";

/**
 * Source: https://github.com/validatorjs/validator.js/blob/63b61629187a732c3b3c8d89fe4cacad890cad99/src/lib/isHexColor.js
 */
const REGEX_COLOR_HEX = /^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;

const URI_REFERENCE: StringFormatOption = "uri-reference" as const;
const MIME_IMAGE = "image/*" as const;
const MIME_FONT = "font/*" as const;

/**
 * Create an extended instance of AJV with better support for @flyyer/variables.
 * @see Website https://ajv.js.org/
 * @example
 * import { Variable as V, Static, Validator } from "@flyyer/variables";
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
  public readonly key = "flyyer-variables";

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
    const instance = new Ajv({
      ...Validator.DEFAULT_OPTIONS,
      ...options,
    });
    this.ajv = addFormats(instance, {
      ...Validator.DEFAULT_FORMATS_OPTIONS,
      ...formatOptions,
    });
    this.ajv.addKeyword("kind").addKeyword("modifier");
    // Add custom formats
    this.ajv.addFormat("color-hex", REGEX_COLOR_HEX);
    // Finalize setup
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
  public parse<Input = unknown>(variables: Input) {
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
   * import { Variable as V, Validator } from "@flyyer/variables";
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
  // Overdrives

  public String<TCustomFormatOption extends string>(
    options?: StringOptions<StringFormatOption | TCustomFormatOption>,
  ): TString {
    return super.String(options);
  }

  // Extensions

  /**
   * EXTENDED: Different from `V.Optional`. This will show the variable on Flyyer UI. `Optional` hides them.
   * @example
   * import { Variable as V, Validator } from "@flyyer/variables";
   * export const schema = V.Object({
   *   background: V.Nullable(V.Image()),
   *   tint: V.Nullable(V.Optional(V.ColorHex({ title: "Tint color" }))),
   * });
   */
  public Nullable<T extends TSchema>(schema: T): TUnion<[T, TNull]> {
    return { ...schema, nullable: true } as any; // facade
  }

  /**
   * EXTENDED: Alternative to `V.Enum` but when you want to **the keys of the enum**.
   * @example
   * import { Variable as V, Validator } from "@flyyer/variables";
   * enum Alignment {
   *   Y = "flex flex-col justify-center",
   *   X = "flex flex-row justify-center",
   * }
   * export const schema = V.Object({
   *   modes: V.EnumKeys(Alignment, { default: "X" }),
   * });
   */
  public EnumKeys<T extends TEnumType>(item: T, options?: CustomOptions): TEnum<keyof T> {
    const keys = Object.keys(item).filter(key => isNaN(key as any)) as (keyof T)[];
    // if (keys.length === 0) {
    //   return { ...options, kind: EnumKind, enum: keys };
    // }
    const type = "string" as const;
    return { ...options, kind: EnumKind, type, enum: keys };
  }

  /**
   * EXTENDED: Intended for URLs. Creates a String schema with `{ format: "uri-reference" }`
   * @example
   * import { Variable as V, Validator } from "@flyyer/variables";
   * export const schema = V.Object({
   *   url: V.URL({ default: "https://flyyer.io" }),
   * });
   */
  public URL<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = URI_REFERENCE;
    return { format, ...options, kind: StringKind, type: "string" };
  }

  /** EXTENDED: Intended for images URLs (relative or absolute). Creates a String schema with `{ format: "uri-reference", contentMediaType: "image/*" }` */
  public Image<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = URI_REFERENCE;

    return { contentMediaType: MIME_IMAGE, format, ...options, kind: StringKind, type: "string" };
  }

  /**
   * EXTENDED: Intended for fonts. Creates a String schema with `{ format: "uri-reference", contentMediaType: "font/*" }`
   * @example
   * import { Variable as V, Validator } from "@flyyer/variables";
   * export const schema = V.Object({
   *   font: V.Font({ default: "Fira Code" }),
   *   fonts: V.Array(V.Font(), { examples: [["Inter", "Roboto"]] }),
   * });
   */
  public Font<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    return { contentMediaType: MIME_FONT, ...options, kind: StringKind, type: "string" };
  }

  /**
   * EXTENDED: Intended for hexadecimal colors. Creates a String schema with `{ format: "color-hex" }`.
   * @example
   * import { Variable as V, Validator } from "@flyyer/variables";
   * export const schema = V.Object({
   *   color: V.Color({ default: "#FFFFFF" }),
   *   colorWithAlpha: V.Color({ default: "#FFFFFF33" }),
   * });
   */
  public ColorHex<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    const format: StringFormatOption = "color-hex";
    // TODO: Conflicts having the pattern here.
    // return { format, ...options, kind: StringKind, type: "string", pattern: REGEX_COLOR_HEX };
    return { format, ...options, kind: StringKind, type: "string" };
  }

  /**
   * EXTENDED: Intended for Emails addresses. Creates a String schema with `{ format: "email" }`
   * @example
   * import { Variable as V, Validator } from "@flyyer/variables";
   * export const schema = V.Object({
   *   email: V.Email({ examples: ["patricio@flyyer.io"] }),
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
   * import { Variable as V, Validator } from "@flyyer/variables";
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
 * import { Variable as V, Static } from "@flyyer/variables";
 * export const schema = V.Object({
 *   title: V.String({ description: "Displayed on https://flyyer.io" }),
 *   description: V.Optional(V.String()),
 *   image: V.Optional(V.Image({
 *     description: "Image URL",
 *     examples: ["https://flyyer.io/logo.png"],
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
 * Check type of variables
 */

export class Is {
  // protected static validate(variable: unknown): any {
  //   if (!variable) throw TypeError("Missing argument");
  // }
  public static Nullable(variable: unknown): boolean {
    // @ts-expect-error Ignore type warning
    return variable["nullable"] === true;
  }
  public static Image(variable: unknown): boolean {
    // @ts-expect-error Ignore type warning
    return this.URL(variable) && variable["contentMediaType"] === MIME_IMAGE;
  }
  public static URL(variable: unknown): boolean {
    if (!variable) throw TypeError("Missing argument");
    // @ts-expect-error Ignore type warning
    return variable["type"] === "string" && variable["format"] === URI_REFERENCE;
  }
  public static Font(variable: unknown): boolean {
    if (!variable) throw TypeError("Missing argument");
    // @ts-expect-error Ignore type warning
    return variable["type"] === "string" && variable["contentMediaType"] === MIME_FONT;
  }
}
