/** @fileoverview Проверка качества, размеров и адресов скачиваемого видео. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { selectVideo, mediaUrl, videoCaption, MAX_URL_SIZE } from '../tgcloud/lib/media.js';
const hd = 'https://v16.tiktokcdn-us.com/hd.mp4';
const play = 'https://www.tikwm.com/video.mp4';

/** Проверяет выбор HD и переход к меньшему файлу. */
function qualitySelection() {
  assert.equal(selectVideo({hdplay: hd, hd_size: 100, play, size: 90}).url, hd);
  assert.equal(selectVideo({hdplay: hd, hd_size: MAX_URL_SIZE + 1, play, size: 90}).url, play);
  assert.equal(selectVideo({play, size: MAX_URL_SIZE + 1}).tooLarge, true);
  assert.equal(selectVideo({images: ['photo.jpg']}), null);
}
test('Качество и ограничения размера', qualitySelection);

/** Проверяет недопустимые адреса и длину подписей. */
function metadataValidation() {
  assert.equal(mediaUrl('https://tiktokcdn-us.com.evil.test/video.mp4'), null);
  assert.equal(mediaUrl('https://localhost/video.mp4'), null);
  assert.equal(mediaUrl('https://user@www.tikwm.com/video.mp4'), null);
  assert.equal(mediaUrl('/video.mp4'), 'https://www.tikwm.com/video.mp4');
  assert.ok(videoCaption({title: 'x'.repeat(2000), author: {unique_id: 'a'.repeat(100)}}).length < 1024);
}
test('Проверка адресов медиа и подписей', metadataValidation);
