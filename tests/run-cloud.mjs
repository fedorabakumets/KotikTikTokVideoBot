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
sources['lib/test-mock'] = fs.readFileSync('tests/mock-services.js', 'utf8');
sources['lib/delivery'] = sources['lib/delivery'].replace("import { api } from 'sdk';", "import { api } from './test-mock.js';")
  .replace("from './provider.js'", "from './test-mock.js'");
sources['lib/test-scenario'] = fs.readFileSync('tests/cloud-scenario.js', 'utf8');
sources['handlers/message'] = `/** @fileoverview Входная точка облачной проверки. */
export {default} from '../lib/test-scenario.js';`;
if (process.argv.includes('--prepare')) {
  fs.writeFileSync('../../work/tiktok-cloud-request.json', JSON.stringify({module:'handlers/message', sources, args:{}, ctx:{}}));
} else {
  const result = await runFunction(process.env.TGCLOUD_TOKEN, 'handlers/message', sources, {}, {});
  console.log(JSON.stringify(result));
}
