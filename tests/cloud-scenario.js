/** @fileoverview Проверка блокировки, кеша и очистки сообщений в реальной облачной базе. */
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { downloads, videos } from '../schema.js';
import { acquire, release } from './storage.js';
import { deliverVideo } from './delivery.js';
import { state } from './test-mock.js';
import { extractLink } from './links.js';
import { selectVideo } from './media.js';
import handleInline from './test-inline.js';
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
    check(state.resolved === 2, 'Для музыки сохранённого ролика не запрошены метаданные');
    check(state.calls.filter(call => call.method === 'sendVideo').at(-1).params.video === 'test-video-file', 'Кеш не использован');
    await resetLease();
    state.fail = true;
    await deliverVideo(userId, url.replace(id, '999999999999998831'));
    check(state.calls.at(-1).method === 'deleteMessage', 'После ошибки осталось сообщение загрузки');
    check(state.calls.some(call => call.params.text === 'Тестовая ошибка сервиса'), 'Ошибка не показана');
    await resetLease();
    check(Boolean(await acquire(userId)), 'Ошибка оставила занятую очередь');
    await resetLease();
    state.fail = false;
    state.photoCount = 11;
    state.music = true;
    const photoUrl = url.replace('/video/', '/photo/').replace(id, '999999999999998832');
    await deliverVideo(userId, photoUrl);
    check(state.calls.some(call => call.method === 'sendMediaGroup' && call.params.media.length === 10), 'Альбом не отправлен');
    check(state.calls.some(call => call.method === 'sendPhoto'), 'Остаток из одной фотографии не отправлен');
    check(state.calls.at(-1).method === 'deleteMessage', 'После альбома осталось сообщение загрузки');
    check(state.calls.some(call => call.method === 'sendAudio'), 'Музыка альбома не отправлена');
    await handleInline({id: 'test-inline', from: {id: userId}, query: url, offset: ''});
    check(state.calls.at(-1).params.results[0].video_file_id === 'test-video-file', 'Inline не использует кеш видео');
    state.photoCount = 51;
    await handleInline({id: 'test-photo', from: {id: userId}, query: photoUrl, offset: '50'});
    check(state.calls.at(-1).params.results.length === 1, 'Inline не выдаёт вторую страницу фото');
    check(state.calls.at(-1).params.button.start_parameter === 'post_999999999999998832', 'Нет кнопки всего альбома');
    await handleInline({id: 'test-music', from: {id: userId}, query: photoUrl, offset: ''});
    check(state.calls.at(-1).params.results.length === 50, 'Фото и музыка превысили лимит inline');
    check(state.calls.at(-1).params.results.at(-1).type === 'audio', 'В inline нет музыки');
    await resetLease();
    state.failAudio = true;
    await deliverVideo(userId, photoUrl);
    check(state.calls.some(call => call.params.reply_markup?.inline_keyboard?.[0]?.[0]?.text === 'Скачать музыку ♫'), 'Нет запасной ссылки музыки');
    state.failAudio = false;
    state.fail = true;
    await handleInline({id: 'test-error', from: {id: userId}, query: photoUrl, offset: ''});
    check(state.calls.at(-1).params.results[0].type === 'article', 'Ошибка inline не показана');
    return {checks};
  } finally {
    await db.delete(downloads).where(eq(downloads.userId, userId)).run();
    await db.delete(videos).where(eq(videos.videoId, id)).run();
  }
}
