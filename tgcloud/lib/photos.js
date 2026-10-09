/** @fileoverview Доставка фотографий публикации альбомами с сохранением порядка. */
import { api } from 'sdk';
import { photoGroups } from './photo-groups.js';

/**
 * Отправляет все фотографии, используя одиночное фото для остатка из одного элемента.
 * @param {number} chatId - Личный чат пользователя.
 * @param {object} post - Публикация с фотографиями.
 * @param {string} source - Проверенная исходная ссылка TikTok.
 * @returns {Promise<Array<object>>} Отправленные сообщения.
 */
export async function deliverPhotos(chatId, post, source) {
  const sent = [];
  for (const group of photoGroups(post)) {
    try {
      if (group.length === 1) sent.push(await api.sendPhoto({chat_id: chatId,
        photo: group[0].media, caption: group[0].caption,
        reply_markup: {inline_keyboard: [[{text: 'Открыть в TikTok ↗', url: source}]]}}));
      else sent.push(...await api.sendMediaGroup({chat_id: chatId, media: group}));
    } catch (error) {
      if (error.code === 403 || error.code === 429) throw error;
      await api.sendMessage({chat_id: chatId,
        text: sent.length ? 'Часть фотографий не загрузилась. Остальные можно скачать по кнопкам ниже.'
          : 'Telegram не смог загрузить фотографии. Скачай их по кнопкам ниже.',
        reply_markup: {inline_keyboard: group.map((item, index) => [{text: `Фото ${sent.length + index + 1} ↓`, url: item.media}])}});
    }
  }
  return sent;
}
