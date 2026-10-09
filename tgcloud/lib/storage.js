/** @fileoverview Атомарная блокировка загрузок и кеш файлов Telegram. */
import { db } from 'sdk';
import { eq, and } from 'sdk/db';
import { downloads, videos } from '../schema.js';

/**
 * Резервирует одну загрузку на пользователя.
 * @param {number} userId - Пользователь Telegram.
 * @returns {Promise<number|null>} Ключ блокировки либо занятая очередь.
 */
export async function acquire(userId) {
  await db.insert(downloads).values({userId}).onConflictDoNothing({target: downloads.userId}).run();
  const row = await db.select().from(downloads).where(eq(downloads.userId, userId)).get();
  const now = Date.now();
  if (row.lease > now) return null;
  const lease = now + 120000;
  const changed = await db.update(downloads).set({lease})
    .where(and(eq(downloads.userId, userId), eq(downloads.lease, row.lease))).returning().run();
  return changed.length ? lease : null;
}

/**
 * Освобождает только принадлежащую этому запросу блокировку.
 * @param {number} userId - Пользователь Telegram.
 * @param {number} lease - Ключ блокировки.
 * @returns {Promise<void>} Завершение записи.
 */
export async function release(userId, lease) {
  await db.update(downloads).set({lease: Date.now() + 3000})
    .where(and(eq(downloads.userId, userId), eq(downloads.lease, lease))).run();
}

/**
 * Находит ранее отправленный ролик.
 * @param {string} id - Идентификатор TikTok.
 * @returns {Promise<object|undefined>} Сохранённый файл.
 */
export async function cachedVideo(id) {
  if (!id) return undefined;
  return db.select().from(videos).where(eq(videos.videoId, id)).get();
}

/**
 * Сохраняет только успешно отправленное видео.
 * @param {object} video - Полученные метаданные.
 * @param {object} message - Сообщение с видео Telegram.
 * @returns {Promise<void>} Завершение записи.
 */
export async function saveVideo(video, message) {
  if (!video.id || !message.video?.file_id) return;
  const record = {videoId: video.id, fileId: message.video.file_id, caption: video.caption};
  await db.insert(videos).values(record).onConflictDoUpdate({target: videos.videoId, set: record}).run();
}
