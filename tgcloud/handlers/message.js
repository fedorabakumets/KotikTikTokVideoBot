/** @fileoverview Личные сообщения бота скачивания публичных роликов TikTok. */
import { api } from 'sdk';
import { extractLink } from '../lib/links.js';
import { deliverVideo } from '../lib/delivery.js';

/**
 * Принимает ссылку и отправляет ролик либо инструкцию.
 * @param {object} message - Сообщение Telegram.
 * @returns {Promise<object|void>} Ответ пользователя.
 */
export default async function handleMessage(message) {
  if (message.chat?.type !== 'private' || message.from?.id !== message.chat.id) return;
  const command = (message.text || '').split(/\s/)[0].split('@')[0].toLowerCase();
  if (['/start', '/help'].includes(command)) return api.sendMessage({chat_id: message.chat.id,
    text: '🐱 Пришли ссылку на видео из TikTok — я отправлю ролик в этот чат.\n\nВ TikTok нажми «Поделиться» → «Копировать ссылку». Подходят обычные и короткие ссылки.\n\nСкачиваю публичные видео. Для крупных файлов пришлю кнопку скачивания.'});
  const url = extractLink(message);
  if (!url) return api.sendMessage({chat_id: message.chat.id,
    text: 'Пришли ссылку на ролик TikTok: https://www.tiktok.com/@имя/video/… или короткую vm.tiktok.com / vt.tiktok.com.'});
  return deliverVideo(message.chat.id, url);
}
