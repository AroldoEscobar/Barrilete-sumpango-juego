import { CUSTOM_LISTS } from '../config/catalog.js';
import { random } from './math.js';

export function isValidConfig(list) {
  return list && list.length == 10 && CUSTOM_LISTS.every((options, i) => options[list[i]]);
}

export function randomConfig() {
  return CUSTOM_LISTS.map(options => (random() * options.length) | 0);
}
