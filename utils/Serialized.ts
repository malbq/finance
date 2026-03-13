/**
 * Recursively converts `Date` fields to `string`, mirroring what JSON serialization produces.
 *
 * Usage:
 *   type WireTransaction = Serialized<Transaction>
 *   // date: Date  →  date: string
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T
