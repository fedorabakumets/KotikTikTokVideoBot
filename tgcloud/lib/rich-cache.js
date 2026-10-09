/** @fileoverview Предзагрузка файлов в закрытый технический канал для inline-отправки. */
import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { richCache } from '../schema.js';
import { canUseRich, richMessage, extractRichFiles } from './rich-media.js';

/** Закрытый канал кеша, где бот имеет право публиковать файлы. */
export const CACHE_CHAT_ID = -1004377692439;

/**
 * Сохраняет файл публикации только после проверки полноты результата Telegram.
 * @param {object} post - Проверенная публикация.
 * @param {string} source - Проверенная ссылка TikTok.
 * @returns {Promise<object|null>} Файлы Telegram либо неподдерживаемый размер публикации.
 */
export async function prepareRich(post, source) {
  if (!canUseRich(post)) return null;
  const key = post.id || source;
  const row = await db.select().from(richCache).where(eq(richCache.key, key)).get();
  if (row) {
    try { richMessage(post, row.files); return row.files; } catch {}
  }
  const uploaded = await api.sendRichMessage({chat_id: CACHE_CHAT_ID, disable_notification: true,
    rich_message: richMessage(post)});
  const files = extractRichFiles(uploaded);
  richMessage(post, files);
  await db.insert(richCache).values({key, files}).onConflictDoUpdate({target: richCache.key, set: {files}}).run();
  try { await api.deleteMessage({chat_id: CACHE_CHAT_ID, message_id: uploaded.message_id}); } catch {}
  return files;
}
