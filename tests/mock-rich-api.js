/** @fileoverview Имитация загрузки rich-сообщений без публикаций в технический канал. */
/** История загрузок и удаления временных сообщений. */
export const calls = [];

/**
 * Преобразует входные блоки в ответ с сохранёнными файлами.
 * @param {object} block - Входной блок сообщения.
 * @returns {object} Блок ответа Telegram.
 */
function uploadedBlock(block) {
  if (block.blocks) return {...block, blocks: block.blocks.map(uploadedBlock)};
  if (block.type === 'photo') return {type: 'photo', photo: [{file_id: 'saved_' + block.photo.media.split('/').pop()}]};
  if (block.type === 'audio') return {type: 'audio', audio: {file_id: 'saved_audio'}};
  if (block.type === 'video') return {type: 'video', video: {file_id: 'saved_video'}};
  return block;
}
/** Подменённые методы загрузки. */
export const api = {
  /**
   * Имитирует загрузку в канал.
   * @param {object} params - Параметры сообщения.
   * @returns {Promise<object>} Сообщение с сохранёнными файлами.
   */
  async sendRichMessage(params) {
    calls.push({method: 'sendRichMessage', params});
    return {message_id: 10, rich_message: {blocks: params.rich_message.blocks.map(uploadedBlock)}};
  },
  /**
   * Имитирует удаление технического сообщения.
   * @param {object} params - Параметры удаления.
   * @returns {Promise<boolean>} Подтверждение удаления.
   */
  async deleteMessage(params) {calls.push({method: 'deleteMessage', params}); return true;},
};
