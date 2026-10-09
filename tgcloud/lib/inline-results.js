/** @fileoverview Результаты inline-поиска для видео, фотографий и понятных ошибок. */
import { musicResult } from './music-media.js';

/**
 * Создаёт текстовый результат подсказки или ошибки.
 * @param {string} text - Текст сообщения.
 * @param {string} title - Название результата.
 * @returns {object} Результат статьи Telegram.
 */
export function hintResult(text, title = 'Как скачать публикацию') {
  return {type: 'article', id: 'hint', title, description: text.slice(0, 150),
    input_message_content: {message_text: text, link_preview_options: {is_disabled: true}}};
}

/**
 * Создаёт кнопку исходной публикации.
 * @param {string} source - Проверенная ссылка TikTok.
 * @returns {object} Клавиатура сообщения.
 */
function sourceButton(source) {
  return {inline_keyboard: [[{text: 'Открыть в TikTok ↗', url: source}]]};
}

/**
 * Создаёт результат для видео, уже сохранённого в Telegram.
 * @param {object} cached - Сохранённый файл видео.
 * @param {string} source - Проверенная исходная ссылка.
 * @returns {object} Готовый результат inline-запроса.
 */
export function cachedResult(cached, source) {
  return {type: 'video', id: 'v_' + cached.videoId, video_file_id: cached.fileId,
    title: 'Отправить видео TikTok', caption: cached.caption, reply_markup: sourceButton(source)};
}

/**
 * Создаёт страницу результатов, не превышающую лимит Telegram.
 * @param {object} post - Проверенные метаданные публикации.
 * @param {string} source - Проверенная исходная ссылка.
 * @param {number} offset - Начало страницы фотографий.
 * @returns {object} Результаты, следующая страница и кнопка перехода в бот.
 */
export function postResults(post, source, offset = 0) {
  const button = {text: post.kind === 'photos' ? 'Весь альбом в боте' : 'Открыть в боте',
    start_parameter: /^\d{15,22}$/.test(post.id) ? 'post_' + post.id : 'help'};
  if (post.kind === 'photos') {
    const audio = offset === 0 ? musicResult(post) : null;
    const pageSize = audio ? 49 : 50;
    const results = post.images.slice(offset, offset + pageSize).map((photo, index) => ({
      type: 'photo', id: `p_${post.id}_${offset + index}`, photo_url: photo, thumbnail_url: photo,
      title: `Фото ${offset + index + 1} из ${post.images.length}`,
      caption: (post.caption + `\n\nФото ${offset + index + 1}/${post.images.length}`).slice(0, 1024),
      reply_markup: sourceButton(source),
    }));
    if (audio) results.push(audio);
    return {results, button, next_offset: offset + pageSize < post.images.length ? String(offset + pageSize) : ''};
  }
  if (offset) return {results: [], button, next_offset: ''};
  if (post.tooLarge || !post.thumbnail) {
    const link = {...hintResult('Скачать видео: ' + post.url, 'Скачать видео по ссылке'),
      reply_markup: {inline_keyboard: [[{text: 'Скачать видео ↓', url: post.url}]]}};
    const audio = musicResult(post);
    return {results: audio ? [link, audio] : [link], button, next_offset: ''};
  }
  const results = [{type: 'video', id: 'v_' + post.id, video_url: post.url, mime_type: 'video/mp4',
    thumbnail_url: post.thumbnail, title: 'Отправить видео TikTok', caption: post.caption,
    video_duration: post.duration, reply_markup: sourceButton(source)}];
  const audio = musicResult(post);
  if (audio) results.push(audio);
  return {results, button, next_offset: ''};
}
