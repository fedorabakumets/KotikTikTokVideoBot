/** @fileoverview Получение публичных видео и фотографий через сервис TikWM. */
import { fetch } from 'sdk';
import { normalizePost } from './post-media.js';
import { cachedPost, savePost } from './post-cache.js';

/**
 * Получает публикацию без загрузки файлов в память Serverless.
 * @param {string} url - Проверенная ссылка TikTok.
 * @returns {Promise<object>} Данные видео или понятная ошибка.
 */
export async function resolvePost(url) {
  try { const saved = await cachedPost(url); if (saved) return saved; } catch {}
  let response;
  try {
    response = await fetch('https://www.tikwm.com/api/', {
      method: 'POST', body: fetch.body.form({url, hd: '1'}),
    });
  } catch { throw new Error('Сервис скачивания сейчас недоступен. Попробуй чуть позже.'); }
  if (!response.ok) throw new Error('Сервис скачивания сейчас недоступен. Попробуй чуть позже.');
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error('Сервис скачивания вернул некорректный ответ. Попробуй позже.'); }
  if (payload.code !== 0 || !payload.data) {
    throw new Error('Не удалось найти ролик. Проверь ссылку: видео должно быть публичным и не удалённым. Для новой короткой ссылки попробуй ещё раз через несколько секунд.');
  }
  const post = normalizePost(payload.data);
  try { await savePost(url, post); } catch { console.log('Не удалось сохранить метаданные публикации.'); }
  return post;
}
