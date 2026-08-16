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
    message += '🔹 <b>Как использовать (ответом на сообщение):</b>\n';
    message += '• Ответь на сообщение → "варн" → предупреждение\n';
    message += '• Ответь на сообщение → "снять варн" → снять предупреждение\n';
    message += '• Ответь на сообщение → "мут 5" → мут на 5 мин\n';
    message += '• Ответь на сообщение → "бан" → бан\n';
    message += '• Ответь на сообщение → "размут" → размутить\n';
    message += '• Ответь на сообщение → "разбан" → разбанить\n';
    message += '• Ответь на сообщение → "варны" → показать варны\n';
    message += '• Напиши "кто я" → информация о себе\n';
    message += '• Напиши "кто ты" → информация о боте\n';
    message += '• Напиши "стат" → статистика\n';
    message += '• Напиши "лог" → логи\n';
  } else {
    message += '🔹 <b>Доступные команды:</b>\n';
    message += 'кто я — информация о себе\n';
    message += 'кто ты — информация о боте\n';
    message += 'помощь — помощь\n';
  }
  
  await ctx.reply(message, { parse_mode: 'HTML' });
});

// ====== ОБРАБОТЧИК ТЕКСТА ======
bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const uid = String(ctx.from.id);
    const username = ctx.from.username || 
                     `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim() || 
                     'unknown';
    
    // === КТО Я (информация о себе) ===
    if (text === 'кто я') {
      const stats = moderator.getUserStatus(uid);
      const user = ctx.from;
      
      let info = `🖤 <b>BLACK MODER — КТО Я</b> 🖤\n\n`;
      info += `👤 <b>Это пользователь</b> ${user.first_name || ''} ${user.last_name || ''}\n`;
      info += `📛 <b>Телеграм-админ этого чата</b>\n\n`;
      info += `────────────────────\n`;
      
      if (config.ADMIN_IDS.includes(ctx.from.id)) {
        info += `👑 <b>Ранг: Создатель</b>\n`;
      } else {
        info += `[0] <b>Ранг: Простой участник</b>\n`;
      }
      info += `🏅 Репутация: 0 | ⭐ 0\n\n`;
      
      const now = new Date();
      const firstSeen = new Date(2026, 5, 30); // 30.06.2026
      const daysDiff = Math.floor((now - firstSeen) / (1000 * 60 * 60 * 24));
      
      info += `📅 Первое появление: 30.06.2026 (${daysDiff} дн)\n`;
      info += `⏰ Последний актив: только что\n`;
      
      if (stats) {
        info += `📊 Актив (д|н|м|весь): ${stats.messagesCount || 0} | ${Math.floor((stats.messagesCount || 0) * 4.5)} | ${Math.floor((stats.messagesCount || 0) * 25)} | ${Math.floor((stats.messagesCount || 0) * 55)}\n\n`;
      } else {
        info += `📊 Актив (д|н|м|весь): 0 | 0 | 0 | 0\n\n`;
      }
      
      info += `────────────────────\n`;
      info += `📝 <b>Описание</b>   🏆 <b>Награды</b>   🎯 <b>Кружки</b>   📌 <b>Закладки</b>`;
      
      await ctx.reply(info, { parse_mode: 'HTML' });
      return;
    }
    
    // === КТО ТЫ ===
    if (text === 'кто ты') {
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
    if (text === 'помощь') {
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
        helpMsg += '🔹 <b>Команды (ответом на сообщение):</b>\n';
        helpMsg += 'варн → предупреждение\n';
        helpMsg += 'снять варн → снять предупреждение\n';
        helpMsg += 'мут 5 → мут на 5 минут\n';
        helpMsg += 'бан → бан\n';
        helpMsg += 'размут → размутить\n';
        helpMsg += 'разбан → разбанить\n';
        helpMsg += 'варны → показать варны\n\n';
        helpMsg += '🔹 <b>Команды (просто в чат):</b>\n';
        helpMsg += 'кто я → информация о себе\n';
        helpMsg += 'кто ты → информация о боте\n';
        helpMsg += 'стат → статистика\n';
        helpMsg += 'лог → логи\n';
      }
      
      helpMsg += '\n🖤 <b>BLACK MODER — всегда на страже порядка!</b>';
      await ctx.reply(helpMsg, { parse_mode: 'HTML' });
      return;
    }
    
    // === ЛОГ ===
    if (text === 'лог') {
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ Только для администраторов!');
      }
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
    if (text === 'стат') {
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ Только для администраторов!');
      }
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
    
    // === ПРОВЕРКА: это команда для бота (требует ответа на сообщение) ===
    const isReplyCommand = text === 'варн' || 
                          text === 'снять варн' ||
                          text.startsWith('мут') || 
                          text === 'бан' || 
                          text === 'размут' ||
                          text === 'разбан' ||
                          text === 'варны';
    
    if (isReplyCommand) {
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ Только для администраторов!');
      }
      
      if (!ctx.message.reply_to_message) {
        return ctx.reply('⚠️ Ответь на сообщение пользователя!');
      }
      
      const target = ctx.message.reply_to_message.from;
      const targetUid = String(target.id);
      const targetName = target.username || 
                        `${target.first_name} ${target.last_name || ''}`.trim() || 
                        'unknown';
      
      // === СНЯТЬ ВАРН ===
      if (text === 'снять варн') {
        const user = moderator._initUser(targetUid);
        if (user.warns > 0) {
          user.warns -= 1;
          moderator._log(`[СНЯТЬ ВАРН] @${targetName} (${targetUid})`);
          await ctx.reply(
            `✅ С пользователя @${targetName} было снято предупреждение (${user.warns + 1} → ${user.warns})`
          );
        } else {
          await ctx.reply(`❌ У пользователя @${targetName} нет предупреждений`);
        }
        return;
      }
      
      // === ВАРН ===
      if (text === 'варн') {
        const user = moderator._initUser(targetUid);
        user.warns += 1;
        
        let extra = '';
        if (user.warns >= config.MODERATION.BAN_THRESHOLD) {
          user.isBanned = true;
          user.mutedUntil = Infinity;
          extra = ' (автоматический бан)';
          try { await ctx.banChatMember(targetUid); } catch(e) {}
        } else if (user.warns >= config.MODERATION.MAX_WARNS) {
          const duration = Math.min(30 * user.warns, 3600);
          user.mutedUntil = Date.now() / 1000 + duration;
          extra = ` (автоматический мут на ${Math.round(duration/60)} мин)`;
          try {
            await ctx.restrictChatMember(targetUid, {
              can_send_messages: false,
              until_date: Math.floor(Date.now() / 1000 + duration)
            });
          } catch(e) {}
        }
        
        moderator._log(`[ВАРН] @${targetName} (${targetUid})`);
        await ctx.reply(
          `⚠️ @${targetName} получает предупреждение (${user.warns}/${config.MODERATION.BAN_THRESHOLD})\n` +
          `Будет снято через 1 неделю\n` +
          `Модератор: @${ctx.from.username || 'админ'}${extra}`
        );
        return;
      }
      
      // === МУТ ===
      if (text.startsWith('мут')) {
        const args = text.split(' ');
        let minutes = 5;
        if (args.length > 1) {
          const parsed = parseInt(args[1]);
          if (!isNaN(parsed) && parsed > 0) minutes = parsed;
        }
        
        const user = moderator._initUser(targetUid);
        const seconds = minutes * 60;
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
        
        moderator._log(`[МУТ] @${targetName} (${targetUid}): ${minutes} мин`);
        await ctx.reply(`🔇 @${targetName} замучен на ${minutes} минут`);
        return;
      }
      
      // === БАН ===
      if (text === 'бан') {
        const user = moderator._initUser(targetUid);
        user.isBanned = true;
        user.mutedUntil = Infinity;
        user.warns = Math.max(user.warns, config.MODERATION.BAN_THRESHOLD);
        try { await ctx.banChatMember(targetUid); } catch(e) {}
        moderator._log(`[БАН] @${targetName} (${targetUid})`);
        await ctx.reply(`🚫 @${targetName} забанен`);
        return;
      }
      
      // === РАЗМУТ ===
      if (text === 'размут') {
        moderator.unmuteUser(targetUid);
        try {
          await ctx.restrictChatMember(targetUid, {
            can_send_messages: true,
            can_send_media_messages: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true
          });
        } catch(e) {}
        moderator._log(`[РАЗМУТ] @${targetName} (${targetUid})`);
        await ctx.reply(`🔊 @${targetName} размучен`);
        return;
      }
      
      // === РАЗБАН ===
      if (text === 'разбан') {
        moderator.unbanUser(targetUid);
        try { await ctx.unbanChatMember(targetUid); } catch(e) {}
        moderator._log(`[РАЗБАН] @${targetName} (${targetUid})`);
        await ctx.reply(`✅ @${targetName} разбанен`);
        return;
      }
      
      // === ВАРНЫ ===
      if (text === 'варны') {
        const stats = moderator.getUserStatus(targetUid);
        if (!stats) {
          return ctx.reply(`📊 @${targetName}\n✅ Нарушений нет`);
        }
        await ctx.reply(
          `📊 <b>СТАТУС ПОЛЬЗОВАТЕЛЯ</b>\n\n` +
          `👤 @${targetName}\n` +
          `⚠️ Предупреждений: ${stats.warns}\n` +
          `🔇 В муте: ${stats.isMuted ? '✅ ДА' : '❌ НЕТ'}\n` +
          `🚫 Забанен: ${stats.isBanned ? '✅ ДА' : '❌ НЕТ'}\n` +
          `📝 Сообщений: ${stats.messagesCount}`,
          { parse_mode: 'HTML' }
        );
        return;
      }
    }
    
    // === ЕСЛИ НЕ КОМАНДА — ПРОВЕРЯЕМ НА ТОКСИЧНОСТЬ ===
    if (config.ADMIN_IDS.includes(ctx.from.id)) {
      return;
    }
    
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
    console.log('⚙️ Версия: BLACK MODER 3.1.0');
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
