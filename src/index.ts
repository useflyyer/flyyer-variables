import { TypeBuilder, StringKind } from "@sinclair/typebox";
import type { Static as TypeBoxStatic, TString, StringFormatOption, StringOptions } from "@sinclair/typebox";

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
