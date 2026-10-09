/** @fileoverview Проверка и нормализация фотографий и видео публикации TikTok. */
import { mediaUrl, selectVideo, videoCaption } from './media.js';
import { normalizeMusic } from './music-media.js';

/**
 * Преобразует ответ скачивания в единый формат публикации.
 * @param {object} data - Ответ внешнего сервиса.
 * @returns {object} Проверенные изображения либо видео.
 */
export function normalizePost(data) {
  const base = {formatVersion: 2, id: String(data.id || ''), caption: videoCaption(data), music: normalizeMusic(data),
    thumbnail: mediaUrl(data.cover) || mediaUrl(data.origin_cover)};
  if (Array.isArray(data.images) && data.images.length) {
    const checked = data.images.map(mediaUrl);
    if (checked.some(image => !image)) throw new Error('Не удалось получить все фотографии публикации. Попробуй другую ссылку.');
    const images = [...new Set(checked)];
    return {...base, kind: 'photos', images, thumbnail: images[0]};
  }
  const video = selectVideo(data);
  if (!video) throw new Error('Для этой публикации не удалось получить видео или фотографии.');
  return {...base, ...video, kind: 'video', duration: Math.max(0, Math.floor(Number(data.duration) || 0))};
}
