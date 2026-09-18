import {SOURCES,THRESHOLDS,MODEL_VERSION,LABELS} from '../lib/config.mjs';import {writeJson} from '../lib/storage.mjs';
await writeJson('dist/data/methodology.json',{sources:SOURCES,thresholds:THRESHOLDS,version:MODEL_VERSION,labels:LABELS});
