/** @fileoverview Сборка единого rich-сообщения и чтение сохранённых файлов Telegram. */

/**
 * Проверяет возможность поместить публикацию в одно сообщение без потери файлов.
 * @param {object} post - Проверенная публикация.
 * @returns {boolean} Публикация помещается в лимит Telegram.
 */
export function canUseRich(post) {
  const count = post.kind === 'photos' ? post.images.length : 1;
  return !post.tooLarge && count > 0 && count + (post.music ? 1 : 0) <= 50;
}

/**
 * Собирает сообщение из адресов файлов или сохранённых идентификаторов.
 * @param {object} post - Проверенная публикация.
 * @param {object} files - Необязательные сохранённые файлы Telegram.
 * @returns {object} Параметр rich_message для Telegram API.
 */
export function richMessage(post, files) {
  if (!canUseRich(post)) throw new Error('Публикация не помещается в одно сообщение.');
  const blocks = [{type: 'paragraph', text: post.caption}];
  if (files) {
    const ids = post.kind === 'photos' ? [...(files.photos || [])] : [files.video];
    if (post.music) ids.push(files.audio);
    if (ids.some(id => typeof id !== 'string' || !id || id.includes('://'))) throw new Error('Медиа ещё не сохранены в Telegram.');
  }
  if (post.kind === 'photos') {
    const images = files ? files.photos : post.images;
    if (images.length !== post.images.length) throw new Error('В кеше отсутствует часть фотографий.');
    const photos = images.map(media => ({type: 'photo', photo: {type: 'photo', media}}));
    blocks.push(photos.length === 1 ? photos[0] : {type: 'slideshow', blocks: photos});
  } else {
    const media = files ? files.video : post.url;
    if (!media) throw new Error('В кеше отсутствует видео.');
    blocks.push({type: 'video', video: {type: 'video', media, supports_streaming: true}});
  }
  if (post.music) {
    const media = files ? files.audio : post.music.url;
    if (!media) throw new Error('В кеше отсутствует музыка.');
    blocks.push({type: 'audio', audio: {type: 'audio', media,
      title: post.music.title, performer: post.music.performer, duration: post.music.duration}});
  }
  return {blocks};
}

/**
 * Извлекает файлы из фактически отправленного rich-сообщения.
 * @param {object} message - Ответ Telegram после отправки.
 * @returns {object} Идентификаторы фото, видео и музыки.
 */
export function extractRichFiles(message) {
  const files = {photos: [], video: null, audio: null};
  const queue = [...(message.rich_message?.blocks || [])];
  while (queue.length) {
    const block = queue.shift();
    if (block.blocks) queue.unshift(...block.blocks);
    if (block.type === 'photo') files.photos.push(block.photo?.[block.photo.length - 1]?.file_id);
    if (block.type === 'video') files.video = block.video?.file_id;
    if (block.type === 'audio') files.audio = block.audio?.file_id;
  }
  return files;
}
