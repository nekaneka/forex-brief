import { SOURCES, THRESHOLDS, MODEL_VERSION, LABELS } from "../lib/config.mjs";
import { writeJson } from "../lib/storage.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { REPORT_SCHEDULE, researchCronBlock } from "../lib/schedule.mjs";
await writeJson("dist/data/methodology.json", {
  sources: SOURCES,
  thresholds: THRESHOLDS,
  version: MODEL_VERSION,
  labels: LABELS,
  schedule: REPORT_SCHEDULE,
});

const workflowPath = ".github/workflows/research.yml";
const workflow = await readFile(workflowPath, "utf8");
const scheduleBlock =
  /(^    # BEGIN GENERATED SCHEDULE\r?\n)[\s\S]*?(?=^    # END GENERATED SCHEDULE)/m;
if (!scheduleBlock.test(workflow)) {
  throw new Error("Research workflow is missing generated schedule markers.");
}
await writeFile(
  workflowPath,
  workflow.replace(
    scheduleBlock,
    (_, opening) => `${opening}${researchCronBlock()}\n`,
  ),
);
