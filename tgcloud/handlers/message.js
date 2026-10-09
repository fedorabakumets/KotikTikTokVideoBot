/** @fileoverview Личные сообщения бота скачивания публичных роликов TikTok. */
import { api } from 'sdk';
import { extractLink } from '../lib/links.js';
import { deliverVideo } from '../lib/delivery.js';
import { sourceForId } from '../lib/post-cache.js';

/**
 * Принимает ссылку и отправляет ролик либо инструкцию.
 * @param {object} message - Сообщение Telegram.
 * @returns {Promise<object|void>} Ответ пользователя.
 */
export default async function handleMessage(message) {
  if (message.chat?.type !== 'private' || message.from?.id !== message.chat.id) return;
  const command = (message.text || '').split(/\s/)[0].split('@')[0].toLowerCase();
  const postId = command === '/start' ? (message.text || '').match(/\s+post_(\d{15,22})$/)?.[1] : null;
  if (postId) {
    const source = await sourceForId(postId);
    if (source) return deliverVideo(message.chat.id, source);
    return api.sendMessage({chat_id: message.chat.id, text: 'Ссылка больше не сохранена. Пришли исходную ссылку TikTok ещё раз.'});
  }
  if (['/start', '/help'].includes(command)) return api.sendMessage({chat_id: message.chat.id,
    text: '🐱 Пришли ссылку TikTok — я отправлю видео или все фотографии альбомом, а доступную музыку — отдельным аудиофайлом.\n\nВ TikTok нажми «Поделиться» → «Копировать ссылку».\n\nВ любом чате введи @KotikTikTokVideoBot ссылка и выбери «Вся публикация одним сообщением» — фото или видео и музыка придут вместе. Можно выбрать отдельное фото, видео или музыку.\n\nСкачиваю публичные публикации. Для крупных файлов пришлю кнопку скачивания.'});
  const url = extractLink(message);
  if (!url) return api.sendMessage({chat_id: message.chat.id,
    text: 'Пришли ссылку на видео или фотопубликацию TikTok: полную ссылку /video/… или /photo/… либо короткую vm.tiktok.com / vt.tiktok.com.'});
  return deliverVideo(message.chat.id, url);
}
