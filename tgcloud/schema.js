/** @fileoverview Кеш отправленных роликов и защита от одновременных загрузок. */
import { table, integer, text, json } from 'sdk/db';
/** Очередь загрузок каждого пользователя. */
export const downloads = table('tiktok_downloads', {
  /** Идентификатор пользователя Telegram. */
  userId: integer('user_id').primaryKey(),
  /** Время истечения блокировки или короткой паузы. */
  lease: integer('lease').notNull().default(0),
});
/** Файлы, уже сохранённые на серверах Telegram этим ботом. */
export const videos = table('tiktok_videos', {
  /** Идентификатор ролика TikTok. */
  videoId: text('video_id').primaryKey(),
  /** Идентификатор видео для повторной отправки. */
  fileId: text('file_id').notNull(),
  /** Подпись к ролику. */
  caption: text('caption').notNull(),
});
/** Кратковременный кеш публикаций для запросов из любых чатов. */
export const posts = table('tiktok_posts', {
  /** Проверенная ссылка либо ключ идентификатора публикации. */
  key: text('key').primaryKey(),
  /** Исходная ссылка на публикацию. */
  source: text('source').notNull(),
  /** Проверенные метаданные видео или фотографий. */
  post: json('post').notNull(),
  /** Время истечения кеша адресов файлов. */
  expires: integer('expires').notNull(),
});
/** Файлы публикации, подготовленные для отправки одним rich-сообщением. */
export const richCache = table('tiktok_rich_cache', {
  /** Идентификатор публикации либо проверенная ссылка. */
  key: text('key').primaryKey(),
  /** Сохранённые идентификаторы фотографий, видео и музыки. */
  files: json('files').notNull(),
});
