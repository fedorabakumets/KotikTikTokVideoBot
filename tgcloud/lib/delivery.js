/** @fileoverview Доставка роликов и удаление временного сообщения загрузки. */
import { api } from 'sdk';
import { videoId } from './links.js';
import { resolveVideo } from './provider.js';
import { acquire, release, cachedVideo, saveVideo } from './storage.js';

/**
 * Создаёт кнопку исходной публикации.
 * @param {string} url - Проверенная ссылка на TikTok.
 * @returns {object} Клавиатура Telegram.
 */
function sourceButton(url) {
  return {inline_keyboard: [[{text: 'Открыть в TikTok ↗', url}]]};
}

/**
 * Удаляет временное сообщение после загрузки.
 * @param {number} chatId - Чат пользователя.
 * @param {number} messageId - Сообщение загрузки.
 * @returns {Promise<void>} Завершение попытки удаления.
 */
async function removeProgress(chatId, messageId) {
  if (!messageId) return;
  try { await api.deleteMessage({chat_id: chatId, message_id: messageId}); } catch {}
}

/**
 * Скачивает ролик или повторно отправляет сохранённый файл.
 * @param {number} chatId - Чат пользователя.
 * @param {string} url - Проверенная ссылка TikTok.
 * @returns {Promise<object|void>} Отправленное видео либо сообщение ошибки.
 */
export async function deliverVideo(chatId, url) {
  const lease = await acquire(chatId);
  if (!lease) return api.sendMessage({chat_id: chatId, text: 'Подожди завершения загрузки и пару секунд перед следующим роликом.'});
  let progress;
  try {
    progress = await api.sendMessage({chat_id: chatId, text: '⏳ Получаю видео…'});
    const cached = await cachedVideo(videoId(url));
    if (cached) {
      try {
        return await api.sendVideo({chat_id: chatId, video: cached.fileId,
          caption: cached.caption, supports_streaming: true, reply_markup: sourceButton(url)});
      } catch (error) { if (error.code !== 400) throw error; }
    }
    const video = await resolveVideo(url);
    if (video.tooLarge) return api.sendMessage({chat_id: chatId,
      text: 'Ролик слишком большой для отправки по ссылке. Можно скачать его по кнопке ниже.',
      reply_markup: {inline_keyboard: [[{text: 'Скачать видео ↓', url: video.url}]]}});
    let sent;
    try {
      sent = await api.sendVideo({chat_id: chatId, video: video.url, caption: video.caption,
        supports_streaming: true, duration: video.duration, reply_markup: sourceButton(url)});
    } catch (error) {
      if (error.code === 429 || error.code === 403) throw error;
      return api.sendMessage({chat_id: chatId, text: 'Telegram не смог загрузить этот файл. Скачай его по кнопке или попробуй ещё раз.',
        reply_markup: {inline_keyboard: [[{text: 'Скачать видео ↓', url: video.url}]]}});
    }
    try { await saveVideo(video, sent); } catch { console.log('Не удалось сохранить кеш видео.'); }
    return sent;
  } catch (error) {
    if (error.code === 403) return;
    const text = error.code === 429 ? 'Слишком много запросов. Подожди немного и попробуй снова.'
      : error.code ? 'Telegram временно не отвечает. Попробуй ещё раз позже.'
      : error.message || 'Не удалось скачать видео. Попробуй позже.';
    return api.sendMessage({chat_id: chatId, text});
  } finally {
    await removeProgress(chatId, progress?.message_id);
    await release(chatId, lease);
  }
}
