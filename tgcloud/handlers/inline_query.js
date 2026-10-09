/** @fileoverview Получение видео или фотографии TikTok в любом чате через имя бота. */
import { api } from 'sdk';
import { extractLink, videoId } from '../lib/links.js';
import { resolvePost } from '../lib/provider.js';
import { cachedVideo } from '../lib/storage.js';
import { hintResult, cachedResult, postResults } from '../lib/inline-results.js';

/**
 * Подготавливает и отправляет результаты inline-запроса.
 * @param {object} query - Запрос Telegram из любого чата.
 * @returns {Promise<boolean|void>} Подтверждение ответа Telegram.
 */
export default async function handleInline(query) {
  if (!query.id || !query.from?.id) return;
  const url = extractLink({text: query.query || ''});
  const offset = /^\d{1,4}$/.test(query.offset || '') ? Number(query.offset) : 0;
  let page;
  if (!url) page = {results: [hintResult('Введи @KotikTikTokVideoBot и ссылку TikTok, затем выбери видео или фотографию.')],
    button: {text: 'Помощь в боте', start_parameter: 'help'}, next_offset: ''};
  else {
    try {
      const cached = await cachedVideo(videoId(url));
      let post;
      try { post = await resolvePost(url); } catch (error) { if (!cached) throw error; }
      page = post ? postResults(post, url, offset) : {results: [], next_offset: ''};
      if (cached && !offset) {
        page.results = page.results.filter(result => result.type === 'audio');
        page.results.unshift(cachedResult(cached, url));
      }
    } catch (error) {
      page = {results: [hintResult(error.code ? 'Сервис временно недоступен. Попробуй позже.' : error.message,
        'Не удалось получить публикацию')], button: {text: 'Открыть бот', start_parameter: 'help'}, next_offset: ''};
    }
  }
  try {
    return await api.answerInlineQuery({inline_query_id: query.id, ...page,
      cache_time: url ? 30 : 1, is_personal: true});
  } catch (error) {
    console.log('Ответ inline-запроса не принят Telegram.', error.code || 'ошибка');
  }
}
