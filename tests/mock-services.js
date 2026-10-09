/** @fileoverview Имитация доставки и скачивания без реальных сообщений. */
/** Состояние сценария и история отправок. */
export const state = {calls: [], resolved: 0, fail: false};

/**
 * Регистрирует вызов API и возвращает тестовое сообщение.
 * @param {string} method - Название метода Telegram.
 * @returns {Function} Функция имитации метода.
 */
function capture(method) {
  return async params => {
    state.calls.push({method, params});
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
};

/**
 * Возвращает данные тестового видео либо ожидаемую ошибку.
 * @param {string} url - Ссылка на тестовый ролик.
 * @returns {Promise<object>} Метаданные ролика.
 */
export async function resolveVideo(url) {
  state.resolved++;
  if (state.fail) throw new Error('Тестовая ошибка сервиса');
  return {id: url.split('/').pop(), url: 'https://www.tikwm.com/test.mp4', caption: 'Тест', duration: 12};
}
