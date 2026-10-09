/** @fileoverview Разбор адресов HTTPS в среде Serverless без глобального класса URL. */

/**
 * Разбирает адрес HTTPS, запрещая пароли, нестандартные порты и обратные слеши.
 * @param {string} value - Проверяемый абсолютный адрес.
 * @returns {object|null} Адрес, имя сервера и путь либо отсутствие корректного адреса.
 */
export function parseHttps(value) {
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f]/.test(value)) return null;
  const matched = value.match(/^https:\/\/([a-z0-9.-]+)(\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i);
  if (!matched) return null;
  const hostname = matched[1].toLowerCase();
  if (hostname.startsWith('.') || hostname.endsWith('.') || hostname.includes('..')) return null;
  return {hostname, pathname: matched[2] || '/', href: value};
}
