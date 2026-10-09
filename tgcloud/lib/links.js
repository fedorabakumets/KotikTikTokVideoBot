/** @fileoverview Извлечение и проверка публичных ссылок на ролики TikTok. */

/**
 * Проверяет ссылку без обращения к произвольным внешним адресам.
 * @param {string} value - Текст ссылки.
 * @returns {string|null} Нормализованная ссылка на ролик.
 */
export function normalizeLink(value) {
  if (typeof value !== 'string' || /\/(?:\.|%2e){1,2}(?:\/|$)/i.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    if (!['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].includes(host)) return null;
    const short = ['vm.tiktok.com', 'vt.tiktok.com'].includes(host) && /^\/[a-zA-Z0-9]+\/?$/.test(url.pathname);
    const shared = /^\/t\/[a-zA-Z0-9]+\/?$/.test(url.pathname);
    const video = /^\/@[^/]+\/video\/\d{15,22}\/?$/.test(url.pathname);
    const mobile = /^\/v\/\d{15,22}\.html$/.test(url.pathname);
    if (!short && !shared && !video && !mobile) return null;
    return `https://${host}${url.pathname}`;
  } catch { return null; }
}

/**
 * Извлекает одну допустимую ссылку, включая скрытые ссылки Telegram.
 * @param {object} message - Сообщение пользователя.
 * @returns {string|null} Ссылка либо отсутствие подходящей ссылки.
 */
export function extractLink(message) {
  const text = message.text || message.caption || '';
  const entities = message.entities || message.caption_entities || [];
  const candidates = entities.filter(entity => entity.type === 'text_link').map(entity => entity.url);
  candidates.push(...(text.match(/https:\/\/[^\s<>]+/gi) || []));
  for (const candidate of candidates) {
    const link = normalizeLink(candidate.replace(/[).,!?;\]}]+$/, ''));
    if (link) return link;
  }
  return null;
}

/**
 * Получает ключ кеша для полной ссылки.
 * @param {string} url - Проверенная ссылка на TikTok.
 * @returns {string|null} Идентификатор ролика либо отсутствие идентификатора.
 */
export function videoId(url) {
  return url.match(/\/(?:video\/|v\/)(\d{15,22})(?:\/|\.html|$)/)?.[1] || null;
}
