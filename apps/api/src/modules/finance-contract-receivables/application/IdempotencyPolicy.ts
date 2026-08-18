import { createHash } from "node:crypto";

export type CanonicalValue = string | boolean | null | readonly CanonicalValue[] | { readonly [key: string]: CanonicalValue };
export interface IdempotencyFingerprint { readonly canonicalParameters: CanonicalValue; readonly fingerprint: string; }

function stableJson(value: CanonicalValue): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as { readonly [key: string]: CanonicalValue };
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key]!)}`).join(",")}}`;
}

export function fingerprintCommand(commandType: string, parameters: CanonicalValue): IdempotencyFingerprint {
  const canonicalParameters: CanonicalValue = { commandType, parameters };
  return { canonicalParameters, fingerprint: createHash("sha256").update(stableJson(canonicalParameters)).digest("hex") };
}

export function canonicalizeAllocations<T extends { installmentId: string; amountCents: bigint | string }>(allocations: readonly T[]): CanonicalValue {
  return allocations.map((allocation) => ({ installmentId: allocation.installmentId, amountCents: allocation.amountCents.toString() }))
    .sort((left, right) => `${left.installmentId}:${left.amountCents}`.localeCompare(`${right.installmentId}:${right.amountCents}`));
}
