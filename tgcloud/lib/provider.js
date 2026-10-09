/** @fileoverview Получение публичного ролика через сервис TikWM. */
import { fetch } from 'sdk';
import { selectVideo, videoCaption } from './media.js';

/**
 * Получает видео без загрузки файла в память Serverless.
 * @param {string} url - Проверенная ссылка TikTok.
 * @returns {Promise<object>} Данные видео или понятная ошибка.
 */
export async function resolveVideo(url) {
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
  const data = payload.data;
  if (data.images?.length) throw new Error('Это публикация с фотографиями. Пока я скачиваю только видео.');
  const video = selectVideo(data);
  if (!video) throw new Error('Для этой публикации не удалось получить видео.');
  return {...video, id: String(data.id || ''), caption: videoCaption(data), duration: Number(data.duration) || 0};
}
