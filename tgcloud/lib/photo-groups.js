/** @fileoverview Деление фотографий на допустимые альбомы Telegram. */

/**
 * Делит фотографии на группы до десяти элементов, сохраняя порядок.
 * @param {object} post - Публикация с фотографиями.
 * @returns {Array<Array<object>>} Группы медиа с единственной подписью.
 */
export function photoGroups(post) {
  const groups = [];
  for (let offset = 0; offset < post.images.length; offset += 10) {
    groups.push(post.images.slice(offset, offset + 10).map((url, index) => ({
      type: 'photo', media: url, ...(offset === 0 && index === 0 ? {caption: post.caption} : {}),
    })));
  }
  return groups;
}
