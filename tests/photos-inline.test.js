/** @fileoverview Проверки альбомов, ссылок на фото и inline-результатов. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLink, videoId } from '../tgcloud/lib/links.js';
import { normalizePost } from '../tgcloud/lib/post-media.js';
import { photoGroups } from '../tgcloud/lib/photo-groups.js';
import { postResults, cachedResult } from '../tgcloud/lib/inline-results.js';
const source = 'https://www.tiktok.com/@cat/photo/7691521249096305934';

/** Проверяет допустимость фото и отклонение чужих адресов. */
function photoLinks() {
  assert.equal(normalizeLink(source + '?tracking=1'), source);
  assert.equal(videoId(source), '7691521249096305934');
  const post = normalizePost({id: '123', images: ['https://p16.tiktokcdn.com/a.jpeg'], title: 'Фото'});
  assert.equal(post.kind, 'photos');
  assert.equal(post.images.length, 1);
  assert.throws(() => normalizePost({images: ['https://evil.test/a.jpg']}));
}
test('Фотопубликации и проверка адресов', photoLinks);

/** Проверяет границы альбомов и единственную подпись. */
function albumGroups() {
  for (const count of [1, 2, 10, 11, 20, 21, 35]) {
    const post = {caption: 'Фото', images: Array.from({length: count}, (_, index) => String(index))};
    const groups = photoGroups(post);
    assert.deepEqual(groups.flat().map(item => item.media), post.images);
    assert.ok(groups.every(group => group.length >= 1 && group.length <= 10));
    assert.equal(groups.flat().filter(item => item.caption).length, 1);
  }
}
test('Альбомы сохраняют порядок и допустимый размер', albumGroups);

/** Проверяет inline-страницы фотографий и результат сохранённого видео. */
function inlinePages() {
  const post = {id: '7691521249096305934', kind: 'photos', caption: 'Фото',
    images: Array.from({length: 51}, (_, index) => 'https://p16.tiktokcdn.com/' + index + '.jpg')};
  const first = postResults(post, source);
  const second = postResults(post, source, 50);
  assert.equal(first.results.length, 50);
  assert.equal(first.next_offset, '50');
  assert.equal(second.results.length, 1);
  assert.equal(second.next_offset, '');
  assert.equal(first.button.start_parameter, 'post_' + post.id);
  assert.equal(new Set([...first.results, ...second.results].map(item => item.id)).size, 51);
  assert.equal(cachedResult({videoId: post.id, fileId: 'file', caption: 'Видео'}, source).video_file_id, 'file');
}
test('Inline-фото, страницы и кеш видео', inlinePages);

/** Проверяет прямое видео и ссылку для слишком большого файла. */
function inlineVideo() {
  const post = {id: '7691521249096305934', kind: 'video', caption: 'Видео',
    url: 'https://www.tikwm.com/video.mp4', thumbnail: 'https://www.tikwm.com/a.jpg', duration: 12};
  assert.equal(postResults(post, source).results[0].type, 'video');
  assert.equal(postResults({...post, tooLarge: true}, source).results[0].type, 'article');
  assert.equal(postResults(post, source, 50).results.length, 0);
}
test('Inline-видео и большие файлы', inlineVideo);
