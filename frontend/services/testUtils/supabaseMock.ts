/**
 * Builds a chainable mock matching the subset of the Supabase JS query-builder
 * surface this codebase actually calls:
 *   .from().insert().select().single()
 *   .from().select().order()
 *   .from().delete().eq()
 *   .from().upsert()
 * Every chain method returns the same builder so calls can be chained in any
 * order the real client supports; the builder itself is thenable so `await`ing
 * it directly (without a terminal .single()) resolves to `result`.
 */
export function createSupabaseQueryBuilderMock(result: { data: any; error: any }) {
  const builder: any = {};
  ["insert", "select", "delete", "eq", "order", "upsert"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  builder.single = jest.fn(() => Promise.resolve(result));
  builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return builder;
}
