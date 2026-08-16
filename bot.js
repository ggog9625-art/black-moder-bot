const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const ChatModerator = require('./moderator');

const bot = new Telegraf(config.BOT_TOKEN);
const moderator = new ChatModerator(config.MODERATION);

// ====== ГЛАВНОЕ МЕНЮ BLACK MODER ======
const mainMenu = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Статистика', 'stats')],
    [Markup.button.callback('👥 Пользователи', 'users')],
    [Markup.button.callback('📝 Логи', 'logs')],
    [Markup.button.callback('⚙️ Настройки', 'settings')],
    [Markup.button.callback('📋 Правила', 'rules')],
    [Markup.button.callback('🛠 Админ-панель', 'admin')],
  ]);
};

// ====== АДМИН-МЕНЮ BLACK MODER ======
const adminMenu = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⚠️ Выдать предупреждение', 'warn_user')],
    [Markup.button.callback('🔇 Замутить', 'mute_user')],
    [Markup.button.callback('🔊 Размутить', 'unmute_user')],
    [Markup.button.callback('🚫 Забанить', 'ban_user')],
    [Markup.button.callback('✅ Разбанить', 'unban_user')],
    [Markup.button.callback('🔄 Сброс предупреждений', 'clear_warns')],
    [Markup.button.callback('🔙 Назад', 'back_main')],
  ]);
};

// ====== КОМАНДА /START ======
bot.start(async (ctx) => {
  const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
  
  let message = '🖤 <b>BLACK MODER</b> 🖤\n\n';
  message += '👋 Привет! Я бот-модератор BLACK MODER.\n';
  message += '🔒 Слежу за порядком в чате 24/7.\n';
  message += '⚡ Мгновенная реакция на нарушения.\n\n';
  message += '🔹 <b>Доступные команды:</b>\n';
  message += '/menu — главное меню\n';
  message += '/help — помощь\n';
  message += '/rules — правила чата\n';
  message += '/stats — статистика\n';
  message += '/status @user — статус пользователя\n';
  
  if (isAdmin) {
    message += '\n🔹 <b>Админ-команды:</b>\n';
    message += '/warn @user — предупреждение\n';
    message += '/mute @user 60 — мут\n';
    message += '/unmute @user — размутить\n';
    message += '/ban @user — бан\n';
    message += '/unban @user — разбан\n';
    message += '/clearwarns @user — сброс предупреждений\n';
    message += '/logs — логи\n';
    message += '/admin — админ-панель\n';
  }
  
  await ctx.reply(message, {
    parse_mode: 'HTML',
    ...mainMenu()
  });
});

// ====== КОМАНДА /MENU ======
bot.command('menu', async (ctx) => {
  await ctx.reply('🖤 <b>BLACK MODER — Главное меню</b>', {
    parse_mode: 'HTML',
    ...mainMenu()
  });
});

// ====== КОМАНДА /HELP ======
bot.command('help', async (ctx) => {
  let message = '🖤 <b>BLACK MODER — ПОМОЩЬ</b> 🖤\n\n';
  message += '⚙️ <b>Автоматическая модерация:</b>\n';
  message += '• 🚫 Токсичные сообщения → предупреждение\n';
  message += '• 🔗 Спам/ссылки → предупреждение\n';
  message += '• 📊 Флуд → мут\n';
  message += '• ⚠️ Угрозы → бан\n';
  message += '• 3 предупреждения → мут\n';
  message += '• 5 предупреждений → бан\n\n';
  
  message += '📌 <b>Команды для всех:</b>\n';
  message += '/start — приветствие\n';
  message += '/menu — главное меню\n';
  message += '/help — помощь\n';
  message += '/rules — правила\n';
  message += '/stats — статистика\n';
  message += '/status @user — статус пользователя\n';
  
  if (config.ADMIN_IDS.includes(ctx.from.id)) {
    message += '\n🔹 <b>Команды для админов:</b>\n';
    message += '/warn @user — предупреждение\n';
    message += '/mute @user 60 — мут\n';
    message += '/unmute @user — размутить\n';
    message += '/ban @user — бан\n';
    message += '/unban @user — разбан\n';
    message += '/clearwarns @user — сброс предупреждений\n';
    message += '/logs — логи\n';
    message += '/admin — админ-панель\n';
    message += '/clear — очистить логи\n';
  }
  
  message += '\n🖤 <b>BLACK MODER — всегда на страже порядка!</b>';
  
  await ctx.reply(message, { parse_mode: 'HTML' });
});

// ====== КОМАНДА /RULES ======
bot.command('rules', async (ctx) => {
  const rules = 
    '🖤 <b>ПРАВИЛА ЧАТА — BLACK MODER</b> 🖤\n\n' +
    '1️⃣ <b>Уважение</b>\n' +
    '   • Без оскорблений и унижений\n' +
    '   • Без мата и грубости\n' +
    '   • Без угроз\n\n' +
    '2️⃣ <b>Без спама</b>\n' +
    '   • Без рекламы\n' +
    '   • Без ссылок\n' +
    '   • Без флуда\n\n' +
    '3️⃣ <b>По теме</b>\n' +
    '   • Общаемся по теме чата\n' +
    '   • Не офтопим\n\n' +
    '4️⃣ <b>Наказания</b>\n' +
    '   • ⚠️ Предупреждение\n' +
    '   • 🔇 Мут (3 предупреждения)\n' +
    '   • 🚫 Бан (5 предупреждений)\n\n' +
    '🖤 <b>BLACK MODER следит за порядком 24/7!</b>';
  
  await ctx.reply(rules, { parse_mode: 'HTML' });
});

// ====== ОБРАБОТЧИК ТЕКСТА (автоматическая модерация) ======
bot.on('text', async (ctx) => {
  try {
    if (ctx.message.text.startsWith('/')) return;
    
    const uid = String(ctx.from.id);
    const text = ctx.message.text;
    const chatId = ctx.chat.id;
    const username = ctx.from.username || 
                     `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim() || 
                     'unknown';
    
    if (config.ADMIN_IDS.includes(ctx.from.id)) {
      return;
    }
    
    const result = await moderator.processMessage(uid, text, chatId, username);
    
    if (result.action === 'allow') {
      return;
    } 
    else if (result.action === 'warn') {
      await ctx.reply(
        `🖤 <b>BLACK MODER</b> 🖤\n\n` +
        `⚠️ <b>ПРЕДУПРЕЖДЕНИЕ #${result.warns}</b>\n` +
        `Причина: ${result.reason}\n` +
        `Токсичность: ${(result.toxicScore * 100).toFixed(0)}%\n\n` +
        `📌 Нарушений: ${result.warns}/${config.MODERATION.BAN_THRESHOLD}`,
        { parse_mode: 'HTML' }
      );
      
      if (config.MODERATION.AUTO_DELETE) {
        setTimeout(async () => {
          try {
            await ctx.deleteMessage();
          } catch(e) {}
        }, config.MODERATION.DELETE_DELAY);
      }
    } 
    else if (result.action === 'mute') {
      await ctx.reply(
        `🖤 <b>BLACK MODER</b> 🖤\n\n` +
        `🔇 <b>МУТ</b>\n` +
        `Причина: ${result.reason}\n` +
        `⏱ Длительность: ${result.duration} секунд\n` +
        `⚠️ Нарушений: ${result.warns}`,
        { parse_mode: 'HTML' }
      );
      
      if (config.MODERATION.AUTO_DELETE) {
        setTimeout(async () => {
          try {
            await ctx.deleteMessage();
          } catch(e) {}
        }, 1000);
      }
    } 
    else if (result.action === 'ban') {
      await ctx.reply(
        `🖤 <b>BLACK MODER</b> 🖤\n\n` +
        `🚫 <b>БАН</b>\n` +
        `Причина: ${result.reason}\n` +
        `⚠️ Нарушений: ${result.warns}`,
        { parse_mode: 'HTML' }
      );
      
      try {
        await ctx.banChatMember(ctx.from.id);
        await ctx.deleteMessage();
      } catch(e) {}
    } 
    else if (result.action === 'muted' || result.action === 'banned') {
      try {
        await ctx.deleteMessage();
      } catch(e) {}
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
});

// ====== КОМАНДА /STATUS ======
bot.command('status', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Использование: /status @username');
  }
  
  const mention = args[1];
  const username = mention.replace('@', '');
  
  try {
    const member = await ctx.getChatMember(username);
    if (!member) {
      return ctx.reply('❌ Пользователь не найден');
    }
    
    const uid = String(member.user.id);
    const stats = moderator.getUserStatus(uid);
    
    if (!stats) {
      return ctx.reply(`📊 Пользователь @${username}\n\n✅ Нарушений нет`);
    }
    
    await ctx.reply(
      `🖤 <b>BLACK MODER — СТАТУС</b> 🖤\n\n` +
      `👤 @${username}\n` +
      `🆔 ${uid}\n\n` +
      `⚠️ Предупреждений: ${stats.warns}\n` +
      `🔇 В муте: ${stats.isMuted ? '✅ ДА' : '❌ НЕТ'}\n` +
      `🚫 Забанен: ${stats.isBanned ? '✅ ДА' : '❌ НЕТ'}\n` +
      `📝 Сообщений: ${stats.messagesCount}\n` +
      `${stats.isMuted ? `⏱ Мут до: ${new Date(stats.mutedUntil * 1000).toLocaleString()}\n` : ''}`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    ctx.reply('❌ Ошибка: пользователь не найден');
  }
});

// ====== АДМИН-КОМАНДЫ ======

// /warn
bot.command('warn', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Использование: /warn @username [причина]');
  }
  
  const mention = args[1];
  const reason = args.slice(2).join(' ') || 'Нарушение правил';
  const username = mention.replace('@', '');
  
  try {
    const member = await ctx.getChatMember(username);
    if (!member) {
      return ctx.reply('❌ Пользователь не найден');
    }
    
    const uid = String(member.user.id);
    const user = moderator._initUser(uid);
    user.warns += 1;
    
    let action = 'warn';
    let extra = '';
    
    if (user.warns >= config.MODERATION.BAN_THRESHOLD) {
      user.isBanned = true;
      user.mutedUntil = Infinity;
      action = 'ban';
      extra = ' (автоматический бан)';
      try {
        await ctx.banChatMember(uid);
      } catch(e) {}
    } else if (user.warns >= config.MODERATION.MAX_WARNS) {
      const duration = Math.min(30 * user.warns, 3600);
      user.mutedUntil = Date.now() / 1000 + duration;
      action = 'mute';
      extra = ` (автоматический мут на ${duration}с)`;
      try {
        await ctx.restrictChatMember(uid, {
          can_send_messages: false,
          until_date: Math.floor(Date.now() / 1000 + duration)
        });
      } catch(e) {}
    }
    
    moderator._log(`[ADMIN_WARN] @${username} (${uid}): ${reason}`);
    
    await ctx.reply(
      `🖤 <b>BLACK MODER</b> 🖤\n\n` +
      `⚠️ <b>ПРЕДУПРЕЖДЕНИЕ</b>\n\n` +
      `👤 Пользователь: @${username}\n` +
      `📝 Причина: ${reason}\n` +
      `📊 Нарушений: ${user.warns}\n` +
      `${action !== 'warn' ? `🔴 Действие: ${action.toUpperCase()}${extra}\n` : ''}`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    ctx.reply('❌ Ошибка: пользователь не найден');
  }
});

// /mute
bot.command('mute', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 3) {
    return ctx.reply('⚠️ Использование: /mute @username 60 [причина]');
  }
  
  const mention = args[1];
  const duration = parseInt(args[2]);
  const reason = args.slice(3).join(' ') || 'Нарушение правил';
  const username = mention.replace('@', '');
  
  if (isNaN(duration) || duration <= 0) {
    return ctx.reply('⚠️ Длительность должна быть числом > 0');
  }
  
  try {
    const member = await ctx.getChatMember(username);
    if (!member) {
      return ctx.reply('❌ Пользователь не найден');
    }
    
    const uid = String(member.user.id);
    const user = moderator._initUser(uid);
    user.mutedUntil = Date.now() / 1000 + duration;
    user.warns += 1;
    
    try {
      await ctx.restrictChatMember(uid, {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        until_date: Math.floor(Date.now() / 1000 + duration)
      });
    } catch(e) {}
    
    moderator._log(`[ADMIN_MUTE] @${username} (${uid}): ${duration}s`);
    
    await ctx.reply(
      `🖤 <b>BLACK MODER</b> 🖤\n\n` +
      `🔇 <b>МУТ</b>\n\n` +
      `👤 Пользователь: @${username}\n` +
      `⏱ Длительность: ${duration} секунд\n` +
      `📝 Причина: ${reason}\n` +
      `📊 Нарушений: ${user.warns}`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    ctx.reply('❌ Ошибка: пользователь не найден');
  }
});

// /unmute
bot.command('unmute', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Использование: /unmute @username');
  }
  
  const mention = args[1];
  const username = mention.replace('@', '');
  
  try {
    const member = await ctx.getChatMember(username);
    if (!member) {
      return ctx.reply('❌ Пользователь не найден');
    }
    
    const uid = String(member.user.id);
    moderator.unmuteUser(uid);
    
    try {
      await ctx.restrictChatMember(uid, {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true
      });
    } catch(e) {}
    
    moderator._log(`[ADMIN_UNMUTE] @${username} (${uid})`);
    await ctx.reply(`🖤 BLACK MODER\n\n✅ Пользователь @${username} размучен`);
    
  } catch (error) {
    ctx.reply('❌ Ошибка: пользователь не найден');
  }
});

// /ban
bot.command('ban', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Использование: /ban @username [причина]');
  }
  
  const mention = args[1];
  const reason = args.slice(2).join(' ') || 'Нарушение правил';
  const username = mention.replace('@', '');
  
  try {
    const member = await ctx.getChatMember(username);
    if (!member) {
      return ctx.reply('❌ Пользователь не найден');
    }
    
    const uid = String(member.user.id);
    const user = moderator._initUser(uid);
    user.isBanned = true;
    user.mutedUntil = Infinity;
    user.warns = Math.max(user.warns, config.MODERATION.BAN_THRESHOLD);
    
    try {
      await ctx.banChatMember(uid);
    } catch(e) {}
    
    moderator._log(`[ADMIN_BAN] @${username} (${uid}): ${reason}`);
    
    await ctx.reply(
      `🖤 <b>BLACK MODER</b> 🖤\n\n` +
      `🚫 <b>БАН</b>\n\n` +
      `👤 Пользователь: @${username}\n` +
      `📝 Причина: ${reason}\n` +
      `📊 Нарушений: ${user.warns}`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    ctx.reply('❌ Ошибка: пользователь не найден');
  }
});

// /unban
bot.command('unban', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Использование: /unban @username');
  }
  
  const mention = args[1];
  const username = mention.replace('@', '');
  
  try {
    const member = await ctx.getChatMember(username);
    if (!member) {
      return ctx.reply('❌ Пользователь не найден');
    }
    
    const uid = String(member.user.id);
    moderator.unbanUser(uid);
    
    try {
      await ctx.unbanChatMember(uid);
    } catch(e) {}
    
    moderator._log(`[ADMIN_UNBAN] @${username} (${uid})`);
    await ctx.reply(`🖤 BLACK MODER\n\n✅ Пользователь @${username} разбанен`);
    
  } catch (error) {
    ctx.reply('❌ Ошибка: пользователь не найден');
  }
});

// /clearwarns
bot.command('clearwarns', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Использование: /clearwarns @username');
  }
  
  const mention = args[1];
  const username = mention.replace('@', '');
  
  try {
    const member = await ctx.getChatMember(username);
    if (!member) {
      return ctx.reply('❌ Пользователь не найден');
    }
    
    const uid = String(member.user.id);
    moderator.clearWarns(uid);
    
    moderator._log(`[ADMIN_CLEARWARNS] @${username} (${uid})`);
    await ctx.reply(`🖤 BLACK MODER\n\n✅ Предупреждения пользователя @${username} сброшены`);
    
  } catch (error) {
    ctx.reply('❌ Ошибка: пользователь не найден');
  }
});

// /logs
bot.command('logs', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  const logs = moderator.getLogs(30);
  if (logs.length === 0) {
    return ctx.reply('📭 Логов пока нет');
  }
  
  const logText = logs.join('\n');
  if (logText.length > 4000) {
    return ctx.replyWithDocument({
      source: Buffer.from(logText, 'utf-8'),
      filename: `logs_${Date.now()}.txt`
    });
  }
  
  await ctx.reply(`🖤 <b>BLACK MODER — ЛОГИ</b>\n\n<pre>${logText}</pre>`, {
    parse_mode: 'HTML'
  });
});

// /stats
bot.command('stats', async (ctx) => {
  const users = moderator.users;
  const totalUsers = users.size;
  let totalWarns = 0;
  let mutedUsers = 0;
  let bannedUsers = 0;
  
  for (const [uid, user] of users) {
    totalWarns += user.warns;
    if (user.isBanned) bannedUsers++;
    else if (user.mutedUntil > Date.now() / 1000) mutedUsers++;
  }
  
  await ctx.reply(
    `🖤 <b>BLACK MODER — СТАТИСТИКА</b> 🖤\n\n` +
    `👥 Всего пользователей: ${totalUsers}\n` +
    `⚠️ Всего предупреждений: ${totalWarns}\n` +
    `🔇 В муте: ${mutedUsers}\n` +
    `🚫 Забанено: ${bannedUsers}\n` +
    `📝 Логов: ${moderator.logs.length}\n` +
    `⚙️ Версия: BLACK MODER 2.0.0\n` +
    `🕐 Обновлено: ${new Date().toLocaleString()}`,
    { parse_mode: 'HTML' }
  );
});

// /admin
bot.command('admin', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  await ctx.reply('🖤 <b>BLACK MODER — АДМИН-ПАНЕЛЬ</b>\n\nВыберите действие:', {
    parse_mode: 'HTML',
    ...adminMenu()
  });
});

// /clear
bot.command('clear', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Только для администраторов');
  }
  
  moderator.logs = [];
  await ctx.reply('🖤 BLACK MODER\n\n✅ Логи очищены');
});

// ====== ОБРАБОТЧИК КНОПОК ======

bot.action('stats', async (ctx) => {
  await ctx.answerCbQuery();
  const users = moderator.users;
  const totalUsers = users.size;
  let totalWarns = 0;
  let mutedUsers = 0;
  let bannedUsers = 0;
  
  for (const [uid, user] of users) {
    totalWarns += user.warns;
    if (user.isBanned) bannedUsers++;
    else if (user.mutedUntil > Date.now() / 1000) mutedUsers++;
  }
  
  await ctx.editMessageText(
    `🖤 <b>BLACK MODER — СТАТИСТИКА</b> 🖤\n\n` +
    `👥 Всего пользователей: ${totalUsers}\n` +
    `⚠️ Всего предупреждений: ${totalWarns}\n` +
    `🔇 В муте: ${mutedUsers}\n` +
    `🚫 Забанено: ${bannedUsers}\n` +
    `📝 Логов: ${moderator.logs.length}\n` +
    `⚙️ Версия: BLACK MODER 2.0.0`,
    { parse_mode: 'HTML', ...mainMenu() }
  );
});

bot.action('users', async (ctx) => {
  await ctx.answerCbQuery();
  const users = moderator.users;
  let text = '🖤 <b>BLACK MODER — ПОЛЬЗОВАТЕЛИ</b> 🖤\n\n';
  
  if (users.size === 0) {
    text += '📭 Пока нет пользователей';
  } else {
    let count = 0;
    for (const [uid, user] of users) {
      count++;
      if (count > 10) {
        text += `\n... и ещё ${users.size - 10} пользователей`;
        break;
      }
      text += `🆔 ${uid} | ⚠️ ${user.warns}`;
      if (user.isBanned) text += ' | 🚫 БАН';
      else if (user.mutedUntil > Date.now() / 1000) text += ' | 🔇 МУТ';
      text += '\n';
    }
  }
  
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    ...mainMenu()
  });
});

bot.action('logs', async (ctx) => {
  await ctx.answerCbQuery();
  const logs = moderator.getLogs(20);
  let text = '🖤 <b>BLACK MODER — ЛОГИ</b> 🖤\n\n';
  
  if (logs.length === 0) {
    text += '📭 Логов пока нет';
  } else {
    text += `<pre>${logs.join('\n')}</pre>`;
  }
  
  if (text.length > 4000) {
    await ctx.replyWithDocument({
      source: Buffer.from(logs.join('\n'), 'utf-8'),
      filename: `logs_${Date.now()}.txt`
    });
    await ctx.editMessageText('🖤 BLACK MODER\n\n📝 Логи отправлены файлом.', {
      parse_mode: 'HTML',
      ...mainMenu()
    });
  } else {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      ...mainMenu()
    });
  }
});

bot.action('settings', async (ctx) => {
  await ctx.answerCbQuery();
  const settings = config.MODERATION;
  
  await ctx.editMessageText(
    `🖤 <b>BLACK MODER — НАСТРОЙКИ</b> 🖤\n\n` +
    `📊 Флуд-окно: ${settings.FLOOD_WINDOW} сек\n` +
    `📊 Макс. сообщений: ${settings.FLOOD_MAX_MSGS}\n` +
    `🎯 Порог токсичности: ${settings.TOXIC_THRESHOLD * 100}%\n` +
    `⚠️ Макс. предупреждений: ${settings.MAX_WARNS}\n` +
    `🚫 Порог бана: ${settings.BAN_THRESHOLD}\n` +
    `🗑 Авто-удаление: ${settings.AUTO_DELETE ? '✅ Вкл' : '❌ Выкл'}\n` +
    `⏱ Задержка удаления: ${settings.DELETE_DELAY / 1000} сек\n\n` +
    `📌 Для изменения настроек отредактируйте файл config.js`,
    { parse_mode: 'HTML', ...mainMenu() }
  );
});

bot.action('rules', async (ctx) => {
  await ctx.answerCbQuery();
  const rules = 
    '🖤 <b>ПРАВИЛА ЧАТА — BLACK MODER</b> 🖤\n\n' +
    '1️⃣ <b>Уважение</b>\n' +
    '   • Без оскорблений и унижений\n' +
    '   • Без мата и грубости\n' +
    '   • Без угроз\n\n' +
    '2️⃣ <b>Без спама</b>\n' +
    '   • Без рекламы\n' +
    '   • Без ссылок\n' +
    '   • Без флуда\n\n' +
    '3️⃣ <b>По теме</b>\n' +
    '   • Общаемся по теме чата\n' +
    '   • Не офтопим\n\n' +
    '4️⃣ <b>Наказания</b>\n' +
    '   • ⚠️ Предупреждение\n' +
    '   • 🔇 Мут (3 предупреждения)\n' +
    '   • 🚫 Бан (5 предупреждений)\n\n' +
    '🖤 <b>BLACK MODER следит за порядком 24/7!</b>';
  
  await ctx.editMessageText(rules, {
    parse_mode: 'HTML',
    ...mainMenu()
  });
});

bot.action('admin', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    await ctx.answerCbQuery('⛔ Только для администраторов!', true);
    return;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText('🖤 <b>BLACK MODER — АДМИН-ПАНЕЛЬ</b>\n\nВыберите действие:', {
    parse_mode: 'HTML',
    ...adminMenu()
  });
});

bot.action('back_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('🖤 <b>BLACK MODER — Главное меню</b>', {
    parse_mode: 'HTML',
    ...mainMenu()
  });
});

// Админ-кнопки
bot.action('warn_user', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🖤 BLACK MODER\n\n Использование: /warn @username [причина]');
});

bot.action('mute_user', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🖤 BLACK MODER\n\n Использование: /mute @username 60 [причина]');
});

bot.action('unmute_user', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🖤 BLACK MODER\n\n Использование: /unmute @username');
});

bot.action('ban_user', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🖤 BLACK MODER\n\n Использование: /ban @username [причина]');
});

bot.action('unban_user', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🖤 BLACK MODER\n\n Использование: /unban @username');
});

bot.action('clear_warns', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🖤 BLACK MODER\n\n Использование: /clearwarns @username');
});

// ====== ЗАПУСК ======

bot.launch()
  .then(() => {
    console.log('🖤 BLACK MODER БОТ ЗАПУЩЕН! 🖤');
    console.log('📋 Токен:', config.BOT_TOKEN ? 'Установлен' : 'ОТСУТСТВУЕТ');
    console.log('👤 Админы:', config.ADMIN_IDS);
    console.log('⚙️ Версия: BLACK MODER 2.0.0');
    console.log('\n Бот готов к работе!');
  })
  .catch(err => {
    console.error(' Ошибка запуска:', err);
  });

process.once('SIGINT', () => {
  console.log('\n BLACK MODER остановлен');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n BLACK MODER остановлен');
  bot.stop('SIGTERM');
});