/** @fileoverview Кеш метаданных публикаций и ссылки для открытия всего альбома. */
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { posts } from '../schema.js';

/**
 * Читает метаданные, пока временные адреса файлов не устарели.
 * @param {string} key - Проверенная ссылка.
 * @returns {Promise<object|undefined>} Метаданные либо отсутствие свежего кеша.
 */
export async function cachedPost(key) {
  const row = await db.select().from(posts).where(eq(posts.key, key)).get();
  return row?.expires > Date.now() && row.post.formatVersion === 2 ? row.post : undefined;
}

/**
 * Сохраняет результат получения публикации на пять минут.
 * @param {string} source - Проверенная ссылка.
 * @param {object} post - Проверенные метаданные.
 * @returns {Promise<void>} Завершение записи.
 */
export async function savePost(source, post) {
  const keys = [source];
  if (/^\d{15,22}$/.test(post.id)) keys.push('id:' + post.id);
  for (const key of keys) {
    const record = {key, source, post, expires: Date.now() + 300000};
    await db.insert(posts).values(record).onConflictDoUpdate({target: posts.key, set: record}).run();
  }
}

/**
 * Возвращает исходную ссылку для кнопки получения целого альбома.
 * @param {string} id - Идентификатор публикации TikTok.
 * @returns {Promise<string|undefined>} Проверенная ранее ссылка.
 */
export async function sourceForId(id) {
  if (!/^\d{15,22}$/.test(id)) return undefined;
  const row = await db.select().from(posts).where(eq(posts.key, 'id:' + id)).get();
  return row?.source;
}
