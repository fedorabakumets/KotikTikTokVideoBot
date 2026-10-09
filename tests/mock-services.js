/** @fileoverview Имитация доставки и скачивания без реальных сообщений. */
/** Состояние сценария и история отправок. */
export const state = {calls: [], resolved: 0, fail: false, photoCount: 0, music: false, failAudio: false};

/**
 * Регистрирует вызов API и возвращает тестовое сообщение.
 * @param {string} method - Название метода Telegram.
 * @returns {Function} Функция имитации метода.
 */
function capture(method) {
  return async params => {
    state.calls.push({method, params});
    if (method === 'sendAudio' && state.failAudio) throw {code: 400};
    if (method === 'sendMediaGroup') return params.media.map((item, index) => ({message_id: index + 100, photo: []}));
    return {message_id: state.calls.length, video: {file_id: 'test-video-file'}};
  };
}
/** Методы тестового API. */
export const api = {
  /** Отправка текстового сообщения. */
  sendMessage: capture('sendMessage'),
  /** Отправка видео. */
  sendVideo: capture('sendVideo'),
  /** Удаление временного сообщения. */
  deleteMessage: capture('deleteMessage'),
  /** Отправка одиночной фотографии. */
  sendPhoto: capture('sendPhoto'),
  /** Отправка альбома. */
  sendMediaGroup: capture('sendMediaGroup'),
  /** Ответ на запрос из любого чата. */
  answerInlineQuery: capture('answerInlineQuery'),
  /** Отправка музыки. */
  sendAudio: capture('sendAudio'),
};

/**
 * Возвращает данные тестового видео либо ожидаемую ошибку.
 * @param {string} url - Ссылка на тестовый ролик.
 * @returns {Promise<object>} Метаданные ролика.
 */
export async function resolvePost(url) {
  state.resolved++;
  if (state.fail) throw new Error('Тестовая ошибка сервиса');
  const music = state.music ? {url: 'https://www.tikwm.com/music.mp3', title: 'Тестовый трек', performer: 'Автор', duration: 30} : null;
  if (state.photoCount) return {id: url.split('/').pop(), kind: 'photos', caption: 'Фотопубликация',
    images: Array.from({length: state.photoCount}, (_, index) => 'https://www.tikwm.com/' + index + '.jpg'), music};
  return {id: url.split('/').pop(), url: 'https://www.tikwm.com/test.mp4', caption: 'Тест', duration: 12, music};
}
