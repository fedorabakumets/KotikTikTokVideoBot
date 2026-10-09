/** @fileoverview Отправка доступной музыки публикации отдельным аудиофайлом. */
import { api } from 'sdk';
import { resolvePost } from './provider.js';

/**
 * Отправляет музыку, сохраняя результат доставки фотографий или видео при ошибке.
 * @param {number} chatId - Личный чат пользователя.
 * @param {object} post - Метаданные публикации с необязательной музыкой.
 * @returns {Promise<object|void>} Аудиосообщение или кнопка скачивания.
 */
export async function deliverMusic(chatId, post) {
  if (!post.music) return;
  try {
    return await api.sendAudio({chat_id: chatId, audio: post.music.url, title: post.music.title,
      performer: post.music.performer, duration: post.music.duration});
  } catch (error) {
    if (error.code === 403) return;
    return api.sendMessage({chat_id: chatId,
      text: 'Музыку не удалось отправить аудиофайлом. Скачай её по кнопке ниже.',
      reply_markup: {inline_keyboard: [[{text: 'Скачать музыку ♫', url: post.music.url}]]}});
  }
}

/**
 * Дополняет сохранённое видео музыкой из метаданных публикации.
 * @param {number} chatId - Личный чат пользователя.
 * @param {string} source - Проверенная ссылка TikTok.
 * @returns {Promise<void>} Завершение попытки отправки музыки.
 */
export async function deliverCachedMusic(chatId, source) {
  try { await deliverMusic(chatId, await resolvePost(source)); }
  catch { await api.sendMessage({chat_id: chatId, text: 'Видео отправлено, но музыку сейчас получить не удалось.'}); }
}
