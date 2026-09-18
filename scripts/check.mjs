import { readFile, readdir, access } from "node:fs/promises";
import { SourceTextModule } from "node:vm";
import path from "node:path";
import { REPORT_SCHEDULE, researchCronBlock } from "../lib/schedule.mjs";
for (const dir of ["lib", "scripts", "dist"])
  for (const name of await readdir(dir)) {
    if (!/\.(mjs|js)$/.test(name)) continue;
    new SourceTextModule(await readFile(path.join(dir, name), "utf8"), {
      identifier: path.join(dir, name),
    });
  }
const html = await readFile("dist/index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const value = match[1];
  if (!/^(https?:|data:|\.\/)/.test(value))
    await access(path.join("dist", value));
}
const config = JSON.parse(await readFile("dist/data/methodology.json", "utf8"));
if (Object.keys(config.sources).length !== 8)
  throw Error("Expected eight currency source registries");
if (JSON.stringify(config.schedule) !== JSON.stringify(REPORT_SCHEDULE)) {
  throw Error("Public schedule is stale. Run node scripts/export-config.mjs.");
}
const workflow = (
  await readFile(".github/workflows/research.yml", "utf8")
).replaceAll("\r\n", "\n");
const actualCron = workflow.match(
  /^    # BEGIN GENERATED SCHEDULE\n([\s\S]*?)^    # END GENERATED SCHEDULE/m,
)?.[1];
if (actualCron !== `${researchCronBlock()}\n`) {
  throw Error(
    "Workflow schedule is stale. Run node scripts/export-config.mjs.",
  );
}
const demo = JSON.parse(await readFile("dist/data/demo.json", "utf8"));
if (
  !demo.demo ||
  demo.currencies.length !== 8 ||
  demo.pairs.length !== 28 ||
  demo.summary.length !== 5
)
  throw Error("Invalid demo dataset");
for (const c of demo.currencies)
  if (50 + c.factors.reduce((n, f) => n + f.points, 0) !== c.score)
    throw Error(`Demo breakdown does not reconcile: ${c.currency}`);
const latest = JSON.parse(await readFile("dist/data/latest.json", "utf8"));
if (latest.demo)
  throw Error("Demo must never be published as latest live report");
for (const f of [
  "dist/app.js",
  "dist/views.js",
  "dist/index.html",
  "dist/data/latest.json",
])
  if (/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/.test(await readFile(f, "utf8")))
    throw Error("Possible secret in public assets");
console.log(
  "Syntax, assets, source registry, preview arithmetic, and public-data checks passed.",
);
