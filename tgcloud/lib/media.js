/** @fileoverview Выбор доступного видео и подготовка подписей. */
/** Максимальный размер видео при отправке в Telegram по ссылке. */
export const MAX_URL_SIZE = 20 * 1024 * 1024;

/**
 * Проверяет адрес медиа, возвращённый сервисом скачивания.
 * @param {string} value - Адрес файла.
 * @returns {string|null} Допустимый адрес HTTPS.
 */
export function mediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, 'https://www.tikwm.com');
    const allowed = ['tikwm.com', 'tiktokcdn.com', 'tiktokcdn-us.com', 'tiktokcdn-eu.com', 'byteoversea.com', 'ibytedtos.com'];
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return allowed.some(host => url.hostname === host || url.hostname.endsWith('.' + host)) ? url.href : null;
  } catch { return null; }
}

/**
 * Выбирает HD, если оно доступно и помещается в лимит отправки.
 * @param {object} data - Метаданные сервиса скачивания.
 * @returns {object|null} Параметры видео либо отсутствие видео.
 */
export function selectVideo(data) {
  const candidates = [
    {url: mediaUrl(data.hdplay), size: Number(data.hd_size), quality: 'HD'},
    {url: mediaUrl(data.play), size: Number(data.size), quality: 'Обычное'},
  ].filter(item => item.url);
  if (!candidates.length) return null;
  return candidates.find(item => Number.isFinite(item.size) && item.size > 0 && item.size <= MAX_URL_SIZE)
    || candidates.find(item => !item.size) || {...candidates[candidates.length - 1], tooLarge: true};
}

/**
 * Создаёт короткую подпись без разметки из внешних данных.
 * @param {object} data - Метаданные ролика.
 * @returns {string} Подпись для Telegram.
 */
export function videoCaption(data) {
  const author = String(data.author?.unique_id || '').slice(0, 80);
  const title = String(data.title || 'Видео из TikTok').slice(0, 800);
  return `${title}${author ? '\n\n@' + author : ''}`;
}
