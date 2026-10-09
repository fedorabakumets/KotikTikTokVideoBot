/** @fileoverview Проверка блокировки, кеша и очистки сообщений в реальной облачной базе. */
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { downloads, videos } from '../schema.js';
import { acquire, release } from './storage.js';
import { deliverVideo } from './delivery.js';
import { state } from './test-mock.js';
import { extractLink } from './links.js';
import { selectVideo } from './media.js';
const userId = -8830209057;
const id = '999999999999998830';
const url = 'https://www.tiktok.com/@test/video/' + id;
let checks = 0;

/**
 * Проверяет условие сценария.
 * @param {boolean} condition - Проверяемое условие.
 * @param {string} message - Описание нарушения.
 * @returns {void} Завершение проверки.
 */
function check(condition, message) {
  if (!condition) throw new Error(message);
  checks++;
}

/**
 * Сбрасывает паузу тестового пользователя.
 * @returns {Promise<void>} Завершение записи.
 */
async function resetLease() {
  await db.update(downloads).set({lease: 0}).where(eq(downloads.userId, userId)).run();
}

/**
 * Выполняет проверки и удаляет временные записи.
 * @returns {Promise<object>} Количество пройденных проверок.
 */
export default async function scenario() {
  try {
    check(extractLink({text: url}) === url, 'Ссылка не распознана в облачной среде');
    check(selectVideo({play: 'https://www.tikwm.com/test.mp4', size: 100}).url.endsWith('test.mp4'), 'Медиа не распознано в облачной среде');
    const leases = await Promise.all([acquire(userId), acquire(userId)]);
    check(leases.filter(Boolean).length === 1, 'Две параллельные загрузки получили блокировку');
    const lease = leases.find(Boolean);
    await release(userId, lease - 1);
    check(await acquire(userId) === null, 'Старая блокировка освободила новую');
    await release(userId, lease);
    check(await acquire(userId) === null, 'После загрузки отсутствует пауза');
    await resetLease();
    await deliverVideo(userId, url);
    check(state.resolved === 1, 'Первый ролик не скачан');
    check(state.calls.some(call => call.method === 'sendVideo'), 'Ролик не отправлен');
    check(state.calls.at(-1).method === 'deleteMessage', 'Сообщение загрузки не удалено');
    await resetLease();
    await deliverVideo(userId, url);
    check(state.resolved === 1, 'Сохранённый ролик скачан повторно');
    check(state.calls.filter(call => call.method === 'sendVideo').at(-1).params.video === 'test-video-file', 'Кеш не использован');
    await resetLease();
    state.fail = true;
    await deliverVideo(userId, url.replace(id, '999999999999998831'));
    check(state.calls.at(-1).method === 'deleteMessage', 'После ошибки осталось сообщение загрузки');
    check(state.calls.some(call => call.params.text === 'Тестовая ошибка сервиса'), 'Ошибка не показана');
    await resetLease();
    check(Boolean(await acquire(userId)), 'Ошибка оставила занятую очередь');
    return {checks};
  } finally {
    await db.delete(downloads).where(eq(downloads.userId, userId)).run();
    await db.delete(videos).where(eq(videos.videoId, id)).run();
  }
}
