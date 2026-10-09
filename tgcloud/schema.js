/** @fileoverview Кеш отправленных роликов и защита от одновременных загрузок. */
import { table, integer, text } from 'sdk/db';
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
