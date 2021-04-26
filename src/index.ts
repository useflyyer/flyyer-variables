import { TypeBuilder } from "@sinclair/typebox";
import type { Static as TypeBoxStatic } from "@sinclair/typebox";

export class VariableBuilder extends TypeBuilder {}

/**
 * Extends https://github.com/sinclairzx81/typebox and add additional types.
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
