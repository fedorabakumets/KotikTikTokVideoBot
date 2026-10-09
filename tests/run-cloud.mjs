/** @fileoverview Облачная проверка доставки с подменой внешних сервисов. */
import fs from 'node:fs';
import {runFunction} from '../node_modules/@tgcloud/cli/src/api/endpoints.js';

/**
 * Собирает исходники облачных модулей.
 * @param {string} directory - Каталог модулей.
 * @param {string} prefix - Префикс имени.
 * @returns {object} Исходники модулей.
 */
function readModules(directory, prefix = '') {
  const sources = {};
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const path = `${directory}/${entry.name}`, name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) Object.assign(sources, readModules(path, name + '/'));
    else if (entry.name.endsWith('.js')) sources[name.slice(0, -3)] = fs.readFileSync(path, 'utf8');
  }
  return sources;
}
const sources = readModules('tgcloud');
const richScenario = process.argv.includes('--rich');
if (richScenario) {
  sources['lib/rich-cache'] = sources['lib/rich-cache'].replace("import { api, db } from 'sdk';",
    "import { db } from 'sdk'; import {api} from './test-rich-api.js';");
  sources['lib/test-rich-api'] = fs.readFileSync('tests/mock-rich-api.js', 'utf8');
} else sources['lib/rich-cache'] = `/** @fileoverview Подмена rich-предзагрузки для стандартных сценариев. */
/** @returns {Promise<null>} Предзагрузка проверяется отдельным сценарием. */
export async function prepareRich() {return null;}`;
sources['lib/test-mock'] = fs.readFileSync('tests/mock-services.js', 'utf8');
sources['lib/delivery'] = sources['lib/delivery'].replace("import { api } from 'sdk';", "import { api } from './test-mock.js';")
  .replace("from './provider.js'", "from './test-mock.js'");
sources['lib/photos'] = sources['lib/photos'].replace("import { api } from 'sdk';", "import { api } from './test-mock.js';");
sources['lib/music'] = sources['lib/music'].replace("import { api } from 'sdk';", "import { api } from './test-mock.js';")
  .replace("from './provider.js'", "from './test-mock.js'");
sources['lib/test-inline'] = sources['handlers/inline_query']
  .replace("import { api } from 'sdk';", "import { api } from './test-mock.js';")
  .replace("from '../lib/provider.js'", "from './test-mock.js'");
sources['lib/test-scenario'] = fs.readFileSync(richScenario ? 'tests/cloud-rich-scenario.js' : 'tests/cloud-scenario.js', 'utf8');
sources['handlers/message'] = `/** @fileoverview Входная точка облачной проверки. */
export {default} from '../lib/test-scenario.js';`;
if (process.argv.includes('--prepare')) {
  fs.writeFileSync(richScenario ? '../../work/tiktok-rich-cloud-request.json' : '../../work/tiktok-cloud-request.json',
    JSON.stringify({module:'handlers/message', sources, args:{}, ctx:{}}));
} else {
  const result = await runFunction(process.env.TGCLOUD_TOKEN, 'handlers/message', sources, {}, {});
  console.log(JSON.stringify(result));
}
