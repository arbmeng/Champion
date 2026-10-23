import ui1 from './ckb-ui-1'
import ui2 from './ckb-ui-2'
import ui3 from './ckb-ui-3'
import data1 from './ckb-data-1'
import data2 from './ckb-data-2'
import extra from './ckb-extra'

// The source text uses Arabic-Indic digits in places; render every number with Western digits so it
// matches the numbers the app computes (charts, stats, set weights).
const toWestern = (s) => s.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))

export const ckb = Object.fromEntries(Object.entries({ ...ui1, ...ui2, ...ui3, ...data1, ...data2, ...extra }).map(([k, v]) => [k, toWestern(v)]))
