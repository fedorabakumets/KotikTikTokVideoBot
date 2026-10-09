/** @fileoverview Проверка аудио TikTok и создание результата отправки музыки. */
import { mediaUrl } from './media.js';

/**
 * Извлекает допустимый адрес музыки и сведения о треке.
 * @param {object} data - Метаданные публикации TikTok.
 * @returns {object|null} Музыка либо отсутствие доступного аудио.
 */
export function normalizeMusic(data) {
  const info = data.music_info || {};
  const url = mediaUrl(data.music) || mediaUrl(info.play);
  if (!url) return null;
  return {url, title: String(info.title || 'Музыка из TikTok').slice(0, 150),
    performer: String(info.author || '').slice(0, 150),
    duration: Math.max(0, Math.floor(Number(info.duration) || 0))};
}

/**
 * Создаёт отдельный inline-результат музыки публикации.
 * @param {object} post - Публикация с музыкой.
 * @returns {object|null} Аудиорезультат либо отсутствие музыки.
 */
export function musicResult(post) {
  if (!post.music) return null;
  return {type: 'audio', id: 'a_' + post.id, audio_url: post.music.url,
    title: post.music.title, performer: post.music.performer, audio_duration: post.music.duration};
}
