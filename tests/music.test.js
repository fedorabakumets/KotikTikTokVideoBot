/** @fileoverview Проверки музыки, безопасных адресов и лимита inline-результатов. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMusic } from '../tgcloud/lib/music-media.js';
import { postResults } from '../tgcloud/lib/inline-results.js';

/** Проверяет сведения о треке и отклонение неизвестных серверов. */
function musicMetadata() {
  const track = normalizeMusic({music: 'https://v16.tiktokcdn-us.com/a.mp3',
    music_info: {title: 'Трек', author: 'Автор', duration: 12.9}});
  assert.equal(track.title, 'Трек');
  assert.equal(track.performer, 'Автор');
  assert.equal(track.duration, 12);
  assert.equal(normalizeMusic({music: 'https://evil.test/a.mp3'}), null);
  assert.equal(normalizeMusic({}), null);
}
test('Проверка адреса музыки и метаданных', musicMetadata);

/** Проверяет полноту фото при добавлении аудио в inline-результаты. */
function inlineMusic() {
  const post = {id: '7691521249096305934', kind: 'photos', caption: 'Фото',
    images: Array.from({length: 51}, (_, index) => 'https://p16.tiktokcdn.com/' + index + '.jpeg'),
    music: {url: 'https://v16.tiktokcdn-us.com/a.mp3', title: 'Трек', performer: 'Автор', duration: 30}};
  const first = postResults(post, 'https://vm.tiktok.com/Test/');
  const next = postResults(post, 'https://vm.tiktok.com/Test/', Number(first.next_offset));
  assert.equal(first.results.length, 50);
  assert.equal(first.results.at(-1).type, 'audio');
  assert.equal(next.results.length, 2);
  assert.equal([...first.results, ...next.results].filter(item => item.type === 'photo').length, 51);
}
test('Фото и музыка помещаются в inline-лимит без потери фотографий', inlineMusic);
