const { Telegraf } = require('telegraf');
const config = require('./config');
const ChatModerator = require('./moderator');

const bot = new Telegraf(config.BOT_TOKEN);
const moderator = new ChatModerator(config.MODERATION);

// ====== КОМАНДА /START ======
bot.start(async (ctx) => {
  const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
  
  let message = '🖤 <b>BLACK MODER</b> 🖤\n\n';
  message += '👋 Привет! Я бот-модератор BLACK MODER.\n';
  message += '🔒 Слежу за порядком в чате 24/7.\n';
  message += '⚡ Мгновенная реакция на нарушения.\n\n';
  
  if (isAdmin) {
    message += '🔹 <b>Команды для админов (в группе):</b>\n';
    message += 'мут @username 5 — мут на 5 минут\n';
    message += 'бан @username — бан\n';
    message += 'варн @username — предупреждение\n';
    message += 'варн @username причина — предупреждение с причиной\n';
    message += 'размут @username — размутить\n';
    message += 'разбан @username — разбанить\n';
    message += 'варны @username — предупреждения пользователя\n';
    message += 'статус @username — статус пользователя\n';
    message += 'кто ты — информация о боте\n';
    message += 'лог — логи\n';
    message += 'стат — статистика\n';
  } else {
    message += '🔹 <b>Доступные команды:</b>\n';
    message += 'кто ты — информация о боте\n';
  }
  
  await ctx.reply(message, { parse_mode: 'HTML' });
});

// ====== КОМАНДА /HELP ======
bot.command('help', async (ctx) => {
  const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
  
  let message = '🖤 <b>BLACK MODER — ПОМОЩЬ</b> 🖤\n\n';
  message += '⚙️ <b>Автоматическая модерация:</b>\n';
  message += '• 🚫 Мат и оскорбления → предупреждение\n';
  message += '• 🔗 Спам и ссылки → предупреждение\n';
  message += '• 📊 Флуд → мут\n';
  message += '• ⚠️ Угрозы → бан\n';
  message += '• 3 предупреждения → мут\n';
  message += '• 5 предупреждений → бан\n\n';
  
  if (isAdmin) {
    message += '🔹 <b>Команды для админов (в группе):</b>\n';
    message += 'мут @username 5 — мут на 5 минут\n';
    message += 'бан @username — бан\n';
    message += 'варн @username — предупреждение\n';
    message += 'варн @username причина — предупреждение с причиной\n';
    message += 'размут @username — размутить\n';
    message += 'разбан @username — разбанить\n';
    message += 'варны @username — предупреждения пользователя\n';
    message += 'статус @username — статус пользователя\n';
    message += 'кто ты — информация о боте\n';
    message += 'лог — логи\n';
    message += 'стат — статистика\n';
  }
  
  message += '\n🖤 <b>BLACK MODER — всегда на страже порядка!</b>';
  
  await ctx.reply(message, { parse_mode: 'HTML' });
});

// ====== ОБРАБОТЧИК ТЕКСТА ======
bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text;
    const uid = String(ctx.from.id);
    const username = ctx.from.username || 
                     `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim() || 
                     'unknown';
    
    // === ПРОВЕРКА: это команда для бота? ===
    const isCommand = text.startsWith('мут') || 
                      text.startsWith('бан') || 
                      text.startsWith('варн') || 
                      text.startsWith('размут') ||
                      text.startsWith('разбан') ||
                      text.startsWith('варны') ||
                      text.startsWith('статус') ||
                      text.startsWith('кто ты') ||
                      text.startsWith('лог') ||
                      text.startsWith('стат') ||
                      text.startsWith('помощь');
    
    if (isCommand) {
      // Проверяем админа (кроме команд "кто ты" и "помощь")
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        if (text.startsWith('кто ты') || text.startsWith('помощь')) {
          // Разрешаем всем
        } else {
          return ctx.reply('⛔ Только для администраторов!');
        }
      }
      
      // === МУТ ===
      if (text.startsWith('мут')) {
        const args = text.split(' ');
        if (args.length < 3) {
          return ctx.reply('⚠️ Использование: мут @username 5 (в минутах)');
        }
        const mention = args[1];
        const duration = parseInt(args[2]);
        const usernameTarget = mention.replace('@', '');
        
        if (isNaN(duration) || duration <= 0) {
          return ctx.reply('⚠️ Укажи время в минутах');
        }
        
        try {
          const member = await ctx.getChatMember(usernameTarget);
          if (!member) return ctx.reply('❌ Пользователь не найден');
          
          const targetUid = String(member.user.id);
          const user = moderator._initUser(targetUid);
          const seconds = duration * 60;
          user.mutedUntil = Date.now() / 1000 + seconds;
          user.warns += 1;
          
          try {
            await ctx.restrictChatMember(targetUid, {
              can_send_messages: false,
              can_send_media_messages: false,
              can_send_other_messages: false,
              can_add_web_page_previews: false,
              until_date: Math.floor(Date.now() / 1000 + seconds)
            });
          } catch(e) {}
          
          moderator._log(`[МУТ] @${usernameTarget} (${targetUid}): ${duration} мин`);
          await ctx.reply(`🔇 @${usernameTarget} замучен на ${duration} минут`);
        } catch(e) {
          ctx.reply('❌ Ошибка: пользователь не найден');
        }
        return;
      }
      
      // === БАН ===
      if (text.startsWith('бан')) {
        const args = text.split(' ');
        if (args.length < 2) {
          return ctx.reply('⚠️ Использование: бан @username');
        }
        const mention = args[1];
        const usernameTarget = mention.replace('@', '');
        
        try {
          const member = await ctx.getChatMember(usernameTarget);
          if (!member) return ctx.reply('❌ Пользователь не найден');
          
          const targetUid = String(member.user.id);
          const user = moderator._initUser(targetUid);
          user.isBanned = true;
          user.mutedUntil = Infinity;
          user.warns = Math.max(user.warns, config.MODERATION.BAN_THRESHOLD);
          
          try {
            await ctx.banChatMember(targetUid);
          } catch(e) {}
          
          moderator._log(`[БАН] @${usernameTarget} (${targetUid})`);
          await ctx.reply(`🚫 @${usernameTarget} забанен`);
        } catch(e) {
          ctx.reply('❌ Ошибка: пользователь не найден');
        }
        return;
      }
      
      // === ВАРН ===
      if (text.startsWith('варн')) {
        const args = text.split(' ');
        if (args.length < 2) {
          return ctx.reply('⚠️ Использование: варн @username [причина]');
        }
        const mention = args[1];
        const reason = args.slice(2).join(' ') || 'Нарушение правил';
        const usernameTarget = mention.replace('@', '');
        
        try {
          const member = await ctx.getChatMember(usernameTarget);
          if (!member) return ctx.reply('❌ Пользователь не найден');
          
          const targetUid = String(member.user.id);
          const user = moderator._initUser(targetUid);
          user.warns += 1;
          
          let action = 'warn';
          let extra = '';
          
          if (user.warns >= config.MODERATION.BAN_THRESHOLD) {
            user.isBanned = true;
            user.mutedUntil = Infinity;
            action = 'бан';
            extra = ' (автоматический бан)';
            try {
              await ctx.banChatMember(targetUid);
            } catch(e) {}
          } else if (user.warns >= config.MODERATION.MAX_WARNS) {
            const duration = Math.min(30 * user.warns, 3600);
            user.mutedUntil = Date.now() / 1000 + duration;
            action = 'мут';
            extra = ` (автоматический мут на ${Math.round(duration/60)} мин)`;
            try {
              await ctx.restrictChatMember(targetUid, {
                can_send_messages: false,
                until_date: Math.floor(Date.now() / 1000 + duration)
              });
            } catch(e) {}
          }
          
          moderator._log(`[ВАРН] @${usernameTarget} (${targetUid}): ${reason}`);
          await ctx.reply(`⚠️ @${usernameTarget} получил предупреждение #${user.warns}\nПричина: ${reason}${extra}`);
        } catch(e) {
          ctx.reply('❌ Ошибка: пользователь не найден');
        }
        return;
      }
      
      // === РАЗМУТ ===
      if (text.startsWith('размут')) {
        const args = text.split(' ');
        if (args.length < 2) {
          return ctx.reply('⚠️ Использование: размут @username');
        }
        const mention = args[1];
        const usernameTarget = mention.replace('@', '');
        
        try {
          const member = await ctx.getChatMember(usernameTarget);
          if (!member) return ctx.reply('❌ Пользователь не найден');
          
          const targetUid = String(member.user.id);
          moderator.unmuteUser(targetUid);
          
          try {
            await ctx.restrictChatMember(targetUid, {
              can_send_messages: true,
              can_send_media_messages: true,
              can_send_other_messages: true,
              can_add_web_page_previews: true
            });
          } catch(e) {}
          
          moderator._log(`[РАЗМУТ] @${usernameTarget} (${targetUid})`);
          await ctx.reply(`🔊 @${usernameTarget} размучен`);
        } catch(e) {
          ctx.reply('❌ Ошибка: пользователь не найден');
        }
        return;
      }
      
      // === РАЗБАН ===
      if (text.startsWith('разбан')) {
        const args = text.split(' ');
        if (args.length < 2) {
          return ctx.reply('⚠️ Использование: разбан @username');
        }
        const mention = args[1];
        const usernameTarget = mention.replace('@', '');
        
        try {
          const member = await ctx.getChatMember(usernameTarget);
          if (!member) return ctx.reply('❌ Пользователь не найден');
          
          const targetUid = String(member.user.id);
          moderator.unbanUser(targetUid);
          
          try {
            await ctx.unbanChatMember(targetUid);
          } catch(e) {}
          
          moderator._log(`[РАЗБАН] @${usernameTarget} (${targetUid})`);
          await ctx.reply(`✅ @${usernameTarget} разбанен`);
        } catch(e) {
          ctx.reply('❌ Ошибка: пользователь не найден');
        }
        return;
      }
      
      // === ВАРНЫ ===
      if (text.startsWith('варны')) {
        const args = text.split(' ');
        if (args.length < 2) {
          return ctx.reply('⚠️ Использование: варны @username');
        }
        const mention = args[1];
        const usernameTarget = mention.replace('@', '');
        
        try {
          const member = await ctx.getChatMember(usernameTarget);
          if (!member) return ctx.reply('❌ Пользователь не найден');
          
          const targetUid = String(member.user.id);
          const stats = moderator.getUserStatus(targetUid);
          
          if (!stats) {
            return ctx.reply(`📊 @${usernameTarget}\n✅ Нарушений нет`);
          }
          
          await ctx.reply(
            `📊 <b>СТАТУС ПОЛЬЗОВАТЕЛЯ</b>\n\n` +
            `👤 @${usernameTarget}\n` +
            `⚠️ Предупреждений: ${stats.warns}\n` +
            `🔇 В муте: ${stats.isMuted ? '✅ ДА' : '❌ НЕТ'}\n` +
            `🚫 Забанен: ${stats.isBanned ? '✅ ДА' : '❌ НЕТ'}\n` +
            `📝 Сообщений: ${stats.messagesCount}`,
            { parse_mode: 'HTML' }
          );
        } catch(e) {
          ctx.reply('❌ Ошибка: пользователь не найден');
        }
        return;
      }
      
      // === СТАТУС ===
      if (text.startsWith('статус')) {
        const args = text.split(' ');
        if (args.length < 2) {
          return ctx.reply('⚠️ Использование: статус @username');
        }
        const mention = args[1];
        const usernameTarget = mention.replace('@', '');
        
        try {
          const member = await ctx.getChatMember(usernameTarget);
          if (!member) return ctx.reply('❌ Пользователь не найден');
          
          const targetUid = String(member.user.id);
          const stats = moderator.getUserStatus(targetUid);
          
          if (!stats) {
            return ctx.reply(`📊 @${usernameTarget}\n✅ Нарушений нет`);
          }
          
          await ctx.reply(
            `📊 <b>СТАТУС ПОЛЬЗОВАТЕЛЯ</b>\n\n` +
            `👤 @${usernameTarget}\n` +
            `⚠️ Предупреждений: ${stats.warns}\n` +
            `🔇 В муте: ${stats.isMuted ? '✅ ДА' : '❌ НЕТ'}\n` +
            `🚫 Забанен: ${stats.isBanned ? '✅ ДА' : '❌ НЕТ'}\n` +
            `📝 Сообщений: ${stats.messagesCount}`,
            { parse_mode: 'HTML' }
          );
        } catch(e) {
          ctx.reply('❌ Ошибка: пользователь не найден');
        }
        return;
      }
      
      // === КТО ТЫ ===
      if (text.startsWith('кто ты')) {
        await ctx.reply(
          `🖤 <b>BLACK MODER</b> 🖤\n\n` +
          `👋 Я бот-модератор этого чата!\n` +
          `🔒 Слежу за порядком 24/7\n` +
          `⚡ Мгновенно реагирую на нарушения\n\n` +
          `📌 <b>Мои функции:</b>\n` +
          `• 🚫 Мат и оскорбления → предупреждение\n` +
          `• 🔗 Спам и ссылки → предупреждение\n` +
          `• 📊 Флуд → мут\n` +
          `• ⚠️ Угрозы → бан\n` +
          `• 3 предупреждения → мут\n` +
          `• 5 предупреждений → бан\n\n` +
          `👨‍💻 Создатель: @qixmoi`,
          { parse_mode: 'HTML' }
        );
        return;
      }
      
      // === ПОМОЩЬ ===
      if (text.startsWith('помощь')) {
        const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
        
        let helpMsg = '🖤 <b>BLACK MODER — ПОМОЩЬ</b> 🖤\n\n';
        helpMsg += '⚙️ <b>Автоматическая модерация:</b>\n';
        helpMsg += '• 🚫 Мат и оскорбления → предупреждение\n';
        helpMsg += '• 🔗 Спам и ссылки → предупреждение\n';
        helpMsg += '• 📊 Флуд → мут\n';
        helpMsg += '• ⚠️ Угрозы → бан\n';
        helpMsg += '• 3 предупреждения → мут\n';
        helpMsg += '• 5 предупреждений → бан\n\n';
        
        if (isAdmin) {
          helpMsg += '🔹 <b>Команды для админов (в группе):</b>\n';
          helpMsg += 'мут @username 5 — мут на 5 минут\n';
          helpMsg += 'бан @username — бан\n';
          helpMsg += 'варн @username — предупреждение\n';
          helpMsg += 'варн @username причина — предупреждение с причиной\n';
          helpMsg += 'размут @username — размутить\n';
          helpMsg += 'разбан @username — разбанить\n';
          helpMsg += 'варны @username — предупреждения пользователя\n';
          helpMsg += 'статус @username — статус пользователя\n';
          helpMsg += 'кто ты — информация о боте\n';
          helpMsg += 'лог — логи\n';
          helpMsg += 'стат — статистика\n';
        }
        
        helpMsg += '\n🖤 <b>BLACK MODER — всегда на страже порядка!</b>';
        
        await ctx.reply(helpMsg, { parse_mode: 'HTML' });
        return;
      }
      
      // === ЛОГ ===
      if (text.startsWith('лог')) {
        const logs = moderator.getLogs(10);
        if (logs.length === 0) {
          return ctx.reply('📭 Логов пока нет');
        }
        await ctx.reply(`📋 <b>Последние логи:</b>\n\n<pre>${logs.join('\n')}</pre>`, {
          parse_mode: 'HTML'
        });
        return;
      }
      
      // === СТАТ ===
      if (text.startsWith('стат')) {
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
          `📊 <b>СТАТИСТИКА МОДЕРАЦИИ</b>\n\n` +
          `👥 Всего пользователей: ${totalUsers}\n` +
          `⚠️ Всего предупреждений: ${totalWarns}\n` +
          `🔇 В муте: ${mutedUsers}\n` +
          `🚫 Забанено: ${bannedUsers}\n` +
          `📝 Логов: ${moderator.logs.length}`,
          { parse_mode: 'HTML' }
        );
        return;
      }
    }
    
    // === ЕСЛИ НЕ КОМАНДА — ПРОВЕРЯЕМ НА ТОКСИЧНОСТЬ ===
    // Админов не модерят
    if (config.ADMIN_IDS.includes(ctx.from.id)) {
      return;
    }
    
    // Пропускаем команды с /
    if (ctx.message.text.startsWith('/')) return;
    
    const chatId = ctx.chat.id;
    const result = await moderator.processMessage(uid, text, chatId, username);
    
    if (result.action === 'allow') {
      return;
    } 
    else if (result.action === 'warn') {
      await ctx.reply(
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

// ====== ЗАПУСК ======

bot.launch()
  .then(() => {
    console.log('🖤 BLACK MODER БОТ ЗАПУЩЕН! 🖤');
    console.log('📋 Токен:', config.BOT_TOKEN ? '✅ Установлен' : '❌ ОТСУТСТВУЕТ');
    console.log('👤 Админы:', config.ADMIN_IDS);
    console.log('⚙️ Версия: BLACK MODER 2.0.0');
    console.log('\n📌 Бот готов к работе!');
  })
  .catch(err => {
    console.error('❌ Ошибка запуска:', err);
  });

process.once('SIGINT', () => {
  console.log('\n🛑 BLACK MODER остановлен');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n🛑 BLACK MODER остановлен');
  bot.stop('SIGTERM');
});
