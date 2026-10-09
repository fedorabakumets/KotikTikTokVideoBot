/** @fileoverview Один inline-результат со всей публикацией TikTok и музыкой. */
import { richMessage } from './rich-media.js';

/**
 * Создаёт единый результат только из заранее сохранённых файлов Telegram.
 * @param {object} post - Проверенная публикация.
 * @param {object} files - Сохранённые файлы Telegram.
 * @param {string} source - Проверенная исходная ссылка.
 * @returns {object} Inline-результат «Вся публикация».
 */
export function wholePostResult(post, files, source) {
  return {type: 'article', id: 'rich_' + post.id, title: 'Вся публикация одним сообщением',
    description: post.kind === 'photos' ? `${post.images.length} фото${post.music ? ' + музыка' : ''}`
      : `Видео${post.music ? ' + музыка' : ''}`,
    ...(post.thumbnail ? {thumbnail_url: post.thumbnail} : {}),
    input_message_content: {rich_message: richMessage(post, files)},
    reply_markup: {inline_keyboard: [[{text: 'Открыть в TikTok ↗', url: source}]]}};
}

/**
 * Добавляет единый результат, соблюдая лимит и смещение страницы фотографий.
 * @param {object} page - Стандартная страница результатов.
 * @param {object} result - Результат всей публикации.
 * @returns {object} Страница с единым результатом на первом месте.
 */
export function addWholePost(page, result) {
  const results = [result, ...page.results];
  if (results.length <= 50) return {...page, results};
  let index = results.length - 1;
  if (results[index].type === 'audio') index--;
  const removed = results.splice(index, 1)[0];
  const offset = removed.id.match(/_(\d+)$/)?.[1];
  return {...page, results, next_offset: offset || page.next_offset};
}
