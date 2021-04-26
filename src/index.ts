import { TypeBuilder, StringKind } from "@sinclair/typebox";
import type { Static as TypeBoxStatic, TString, StringFormatOption, StringOptions } from "@sinclair/typebox";
import Ajv, { JSONSchemaType, Options, Schema, ValidateFunction } from "ajv";

/**
 * Create an extended instance of AJV with better support for @flayyer/variables.
 * @see Website https://ajv.js.org/
 */
export class Validator<D> {
  /** Cached instance of AJV */
  public readonly ajv: Ajv;
  /** Schema key */
  public readonly key = "flayyer-variables";

  public constructor(schema: /*Schema |*/ JSONSchemaType<D>, options: Options) {
    this.ajv = new Ajv({
      coerceTypes: "array",
      strict: false,
      useDefaults: true,
      removeAdditional: true,
      allErrors: true,
      ...options,
    })
      .addKeyword("kind")
      .addKeyword("modifier")
      .addSchema(schema, this.key);
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
  /** EXTENDED: Intended for images URLs (relative or absolute). Creates and String schema with `{ contentMediaType: "image/*", format: "uri-reference" }` */
  public Image<TCustomFormatOption extends string>(
    options: StringOptions<StringFormatOption | TCustomFormatOption> = {},
  ): TString {
    return { contentMediaType: "image/*", format: "uri-reference", ...options, kind: StringKind, type: "string" };
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
