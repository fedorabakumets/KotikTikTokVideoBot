/** @fileoverview Проверки ссылок TikTok и защиты от подмены адресов. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLink, extractLink, videoId } from '../tgcloud/lib/links.js';

/** Проверяет поддерживаемые виды ссылок. */
function supportedLinks() {
  assert.equal(normalizeLink('https://www.tiktok.com/@cat/video/7691521249096305934?foo=bar'),
    'https://www.tiktok.com/@cat/video/7691521249096305934');
  assert.equal(normalizeLink('https://vm.tiktok.com/ZMabc/'), 'https://vm.tiktok.com/ZMabc/');
  assert.equal(normalizeLink('https://vt.tiktok.com/ZMxyz/'), 'https://vt.tiktok.com/ZMxyz/');
  assert.equal(normalizeLink('https://www.tiktok.com/t/ZM123/'), 'https://www.tiktok.com/t/ZM123/');
  assert.equal(videoId('https://m.tiktok.com/v/7691521249096305934.html'), '7691521249096305934');
}
test('Полные, короткие и мобильные ссылки', supportedLinks);

/** Проверяет запрет чужих доменов, паролей, портов и профилей. */
function unsafeLinks() {
  for (const link of ['https://tiktok.com.evil.test/@cat/video/7691521249096305934',
    'http://www.tiktok.com/@cat/video/7691521249096305934',
    'https://user@www.tiktok.com/@cat/video/7691521249096305934',
    'https://www.tiktok.com:444/@cat/video/7691521249096305934',
    'https://www.tiktok.com/@cat', 'https://127.0.0.1/', 'https://vm.tiktok.com/../../../secret']) {
    assert.equal(normalizeLink(link), null);
  }
}
test('Небезопасные адреса и ссылки на профиль отклоняются', unsafeLinks);

/** Проверяет ссылки в тексте, подписи и скрытых сущностях Telegram. */
function messageLinks() {
  assert.equal(extractLink({text: 'Скачай (https://vm.tiktok.com/ZMabc/).'}), 'https://vm.tiktok.com/ZMabc/');
  assert.equal(extractLink({caption: 'https://vt.tiktok.com/ZM123/'}), 'https://vt.tiktok.com/ZM123/');
  assert.equal(extractLink({text: 'ролик', entities: [{type: 'text_link', url: 'https://vm.tiktok.com/ZMabc/'}]}),
    'https://vm.tiktok.com/ZMabc/');
  assert.equal(extractLink({text: 'Не ссылка'}), null);
}
test('Ссылки из сообщений Telegram', messageLinks);
