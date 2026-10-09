/** @fileoverview Облачные проверки предзагрузки и повторного использования rich-публикаций. */
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { richCache } from '../schema.js';
import { prepareRich } from './rich-cache.js';
import { wholePostResult } from './rich-inline.js';
import { calls } from './test-rich-api.js';
const id = '999999999999998840';
let checks = 0;

/**
 * Проверяет условие сценария.
 * @param {boolean} condition - Проверяемое условие.
 * @param {string} text - Объяснение ошибки.
 * @returns {void} Подтверждение проверки.
 */
function check(condition, text) {
  if (!condition) throw new Error(text);
  checks++;
}

/**
 * Проверяет загрузку и кеш, удаляя временную запись.
 * @returns {Promise<object>} Количество пройденных проверок.
 */
export default async function testRichCache() {
  const post = {id, kind: 'photos', caption: 'Фотографии',
    images: ['https://www.tikwm.com/1.jpg', 'https://www.tikwm.com/2.jpg'],
    music: {url: 'https://www.tikwm.com/a.mp3', title: 'Трек', performer: 'Автор', duration: 59}};
  try {
    const files = await prepareRich(post, 'https://vm.tiktok.com/Test/');
    check(files.photos.length === 2 && files.audio === 'saved_audio', 'Не сохранены фото или музыка');
    check(calls.filter(call => call.method === 'sendRichMessage').length === 1, 'Нет одной загрузки в кеш');
    check(calls.filter(call => call.method === 'deleteMessage').length === 1, 'Техническое сообщение не удалено');
    const again = await prepareRich(post, 'https://vm.tiktok.com/Test/');
    check(again.photos.length === 2, 'Повторная подготовка изменила число фото');
    check(calls.filter(call => call.method === 'sendRichMessage').length === 1, 'Кеш загружен повторно');
    const inline = wholePostResult(post, again, 'https://vm.tiktok.com/Test/');
    check(inline.input_message_content.rich_message.blocks[1].blocks.length === 2, 'Inline потерял фотографии');
    check(inline.input_message_content.rich_message.blocks[2].audio.media === 'saved_audio', 'Inline потерял музыку');
    check(await prepareRich({...post, images: Array(50).fill(post.images[0])}, 'test') === null, 'Превышен лимит rich-сообщения');
    return {checks};
  } finally {await db.delete(richCache).where(eq(richCache.key, id)).run();}
}
