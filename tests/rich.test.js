/** @fileoverview Проверки единого сообщения, кеша файлов и страниц inline-результатов. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {canUseRich, richMessage, extractRichFiles} from '../tgcloud/lib/rich-media.js';
import {wholePostResult, addWholePost} from '../tgcloud/lib/rich-inline.js';
import {postResults} from '../tgcloud/lib/inline-results.js';
const post = {id: '7693887934189030676', kind: 'photos', caption: '<Фото>',
  images: ['https://www.tikwm.com/1.jpeg', 'https://www.tikwm.com/2.jpeg'],
  music: {url: 'https://www.tikwm.com/a.mp3', title: 'Трек', duration: 59}};
const source = 'https://www.tiktok.com/t/ZPL61Xwaa/';

/** Проверяет содержание rich-сообщения и требование сохранённых файлов. */
function fullMessage() {
  const files = {photos: ['photo1', 'photo2'], audio: 'audio1'};
  const rich = wholePostResult(post, files, source).input_message_content.rich_message;
  assert.equal(rich.blocks[0].text, '<Фото>');
  assert.equal(rich.blocks[1].type, 'slideshow');
  assert.equal(rich.blocks[1].blocks.length, 2);
  assert.equal(rich.blocks[2].audio.media, 'audio1');
  assert.ok(!JSON.stringify(rich).includes('https://'));
  assert.throws(() => richMessage(post, {photos: ['photo1'], audio: 'audio1'}));
  assert.throws(() => richMessage(post, {photos: post.images, audio: 'audio1'}));
}
test('Все фотографии и музыка используют сохранённые файлы', fullMessage);

/** Проверяет предел медиа без тихого удаления музыки или фотографий. */
function mediaLimits() {
  assert.equal(canUseRich({...post, images: Array(49).fill('photo')}), true);
  assert.equal(canUseRich({...post, images: Array(50).fill('photo')}), false);
  assert.equal(canUseRich({...post, images: Array(50).fill('photo'), music: null}), true);
}
test('Лимит 50 файлов учитывает музыку', mediaLimits);

/** Проверяет порядок чтения вложенных фотографий и качество сохранённого фото. */
function uploadedFiles() {
  const files = extractRichFiles({rich_message: {blocks: [{type: 'slideshow', blocks: [
    {type: 'photo', photo: [{file_id: 'small'}, {file_id: 'large'}]},
    {type: 'photo', photo: [{file_id: 'second'}]},
  ]}, {type: 'audio', audio: {file_id: 'audio'}}]}});
  assert.deepEqual(files.photos, ['large', 'second']);
  assert.equal(files.audio, 'audio');
}
test('Файлы извлекаются из ответа Telegram в исходном порядке', uploadedFiles);

/** Проверяет, что единый результат не вытесняет фото без следующей страницы. */
function inlinePagination() {
  const many = {...post, images: Array.from({length: 49}, (_, i) => 'https://www.tikwm.com/' + i + '.jpeg')};
  const base = postResults(many, source);
  const first = addWholePost(base, {type: 'article', id: 'whole'});
  assert.equal(first.results.length, 50);
  assert.equal(first.results.at(-1).type, 'audio');
  assert.equal(first.next_offset, '48');
  assert.equal(postResults(many, source, 48).results[0].id, 'p_' + post.id + '_48');
}
test('Единый inline-результат сохраняет все фотографии при разбиении на страницы', inlinePagination);
