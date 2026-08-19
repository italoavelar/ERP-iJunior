import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const specPath = join(root, ".specs/features/finance-contract-receivables/spec.md");
const taskPath = join(root, ".specs/features/finance-contract-receivables/tasks.md");
const requirementPattern = /\b(?:PLAN|INST|RECEIPT|REVERSE|IDEMP|ACCESS|EDGE)-\d{2}\b/g;
const unique = (values: Iterable<string>) => [...new Set(values)].sort();

const [spec, tasks] = await Promise.all([readFile(specPath, "utf8"), readFile(taskPath, "utf8")]);
const specIds = unique(spec.match(requirementPattern) ?? []);
const coveredIds = unique(tasks.match(requirementPattern) ?? []);
const missing = specIds.filter((id) => !coveredIds.includes(id));
const unknown = coveredIds.filter((id) => !specIds.includes(id));

console.log(JSON.stringify({ specIds: specIds.length, coveredIds: coveredIds.length, missing, unknown }));
if (missing.length || unknown.length || specIds.length !== 71) process.exit(1);
