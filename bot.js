const { Telegraf } = require('telegraf');
const config = require('./config');
const ChatModerator = require('./moderator');

const bot = new Telegraf(config.BOT_TOKEN);
const moderator = new ChatModerator(config.MODERATION);

// ====== КОМАНДА /START ======
bot.start(async (ctx) => {
  const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
  
  let message = '🖤 <b>BLACK MODER v4.0</b> 🖤\n\n';
  message += '👋 Привет! Я бот-модератор BLACK MODER.\n';
  message += '🔒 Слежу за порядком в чате 24/7.\n';
  message += '⚡ Мгновенная реакция на нарушения.\n\n';
  
  if (isAdmin) {
    message += '🔹 <b>КОМАНДЫ (ответом на сообщение):</b>\n';
    message += '────────────────────\n';
    message += '👮 <b>Модерация:</b>\n';
    message += 'варн — выдать предупреждение\n';
    message += 'снять варн — снять предупреждение\n';
    message += 'снять варны — снять все предупреждения\n';
    message += 'мут 5 — мут на 5 минут\n';
    message += 'бан — бан\n';
    message += 'размут — снять мут\n';
    message += 'разбан — снять бан\n';
    message += 'варны — показать предупреждения\n';
    message += 'очистить варны — очистить все варны\n\n';
    message += '👤 <b>Информация:</b>\n';
    message += 'кто я — информация о себе\n';
    message += 'кто ты — информация о пользователе\n';
    message += 'стат — статистика чата\n';
    message += 'лог — последние логи\n';
    message += 'помощь — помощь\n';
  } else {
    message += '🔹 <b>Доступные команды:</b>\n';
    message += 'кто я — информация о себе\n';
    message += 'кто ты — информация о пользователе (ответом)\n';
    message += 'помощь — помощь\n';
  }
  
  await ctx.reply(message, { parse_mode: 'HTML' });
});

// ====== ФУНКЦИЯ ДЛЯ НОРМАЛИЗАЦИИ ТЕКСТА ======
function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ====== ФУНКЦИЯ ДЛЯ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ ======
function getUserProfile(user, stats, isTargetAdmin) {
  const warns = stats ? stats.warns : 0;
  const isMuted = stats ? stats.mutedUntil > Date.now() / 1000 : false;
  const isBanned = stats ? stats.isBanned : false;
  const msgCount = stats ? stats.messagesCount : 0;
  
  let rank = '🌟 Простой участник';
  let rankIcon = '🌟';
  
  if (isTargetAdmin) {
    rank = '👑 Создатель';
    rankIcon = '👑';
  } else if (warns >= 5) {
    rank = '🚫 Нарушитель';
    rankIcon = '🚫';
  } else if (warns >= 3) {
    rank = '⚠️ На грани';
    rankIcon = '⚠️';
  } else if (warns >= 1) {
    rank = '📌 Наблюдаемый';
    rankIcon = '📌';
  }
  
  const name = user.first_name || 'Unknown';
  const username = user.username ? `@${user.username}` : 'нет';
  
  let text = `🖤 <b>BLACK MODER — ПРОФИЛЬ</b> 🖤\n\n`;
  text += `👤 <b>Пользователь:</b> ${name}\n`;
  text += `📛 <b>Юзернейм:</b> ${username}\n`;
  text += `🆔 <b>ID:</b> ${user.id}\n\n`;
  text += `────────────────────\n`;
  text += `${rankIcon} <b>Ранг:</b> ${rank}\n`;
  text += `⚠️ <b>Предупреждений:</b> ${warns}\n`;
  text += `🔇 <b>В муте:</b> ${isMuted ? '✅ ДА' : '❌ НЕТ'}\n`;
  text += `🚫 <b>Забанен:</b> ${isBanned ? '✅ ДА' : '❌ НЕТ'}\n`;
  text += `📝 <b>Сообщений:</b> ${msgCount}\n\n`;
  text += `────────────────────\n`;
  text += `📅 <b>В чате с:</b> ${new Date().toLocaleDateString('ru-RU')}\n`;
  
  if (isMuted && stats) {
    const remaining = stats.mutedUntil - Date.now() / 1000;
    text += `⏱ <b>Мут до:</b> ${getTimeRemaining(stats.mutedUntil)}\n`;
  }
  
  return text;
}

// ====== ФУНКЦИЯ ДЛЯ ВРЕМЕНИ ======
function getTimeRemaining(timestamp) {
  const now = Date.now() / 1000;
  const diff = timestamp - now;
  if (diff <= 0) return '0 секунд';
  const minutes = Math.floor(diff / 60);
  const seconds = Math.floor(diff % 60);
  if (minutes > 0) return `${minutes} мин ${seconds} сек`;
  return `${seconds} сек`;
}

// ====== ОСНОВНОЙ ОБРАБОТЧИК ======
bot.on('text', async (ctx) => {
  try {
    const rawText = ctx.message.text;
    const text = normalize(rawText);
    const uid = String(ctx.from.id);
    const username = ctx.from.username || 
                     `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim() || 
                     'unknown';
    
    // === КТО Я ===
    if (text === 'кто я') {
      const stats = moderator.getUserStatus(uid);
      const user = ctx.from;
      const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
      await ctx.reply(getUserProfile(user, stats, isAdmin), { parse_mode: 'HTML' });
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
        helpMsg += '────────────────────\n';
        helpMsg += 'варн — выдать предупреждение\n';
        helpMsg += 'снять варн — снять предупреждение\n';
        helpMsg += 'снять варны — снять все предупреждения\n';
        helpMsg += 'мут 5 — мут на 5 минут\n';
        helpMsg += 'бан — бан\n';
        helpMsg += 'размут — снять мут\n';
        helpMsg += 'разбан — снять бан\n';
        helpMsg += 'варны — показать предупреждения\n';
        helpMsg += 'очистить варны — очистить все варны\n\n';
        helpMsg += '🔹 <b>Команды (просто в чат):</b>\n';
        helpMsg += 'кто я — информация о себе\n';
        helpMsg += 'кто ты — информация о пользователе\n';
        helpMsg += 'стат — статистика чата\n';
        helpMsg += 'лог — последние логи\n';
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
    
    // === КТО ТЫ (ответом на сообщение) ===
    if (text === 'кто ты') {
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ Только для администраторов!');
      }
      
      if (!ctx.message.reply_to_message) {
        return ctx.reply('⚠️ Ответь на сообщение пользователя!');
      }
      
      const target = ctx.message.reply_to_message.from;
      const targetUid = String(target.id);
      const stats = moderator.getUserStatus(targetUid);
      const isAdmin = config.ADMIN_IDS.includes(target.id);
      
      await ctx.reply(getUserProfile(target, stats, isAdmin), { parse_mode: 'HTML' });
      return;
    }
    
    // === ПРОВЕРКА: ЭТО КОМАНДА ДЛЯ АДМИНОВ (ТРЕБУЕТ ОТВЕТА) ===
    const adminCommands = ['варн', 'снять варн', 'снять варны', 'мут', 'бан', 'размут', 'разбан', 'варны', 'очистить варны'];
    const isAdminCmd = adminCommands.some(cmd => text === cmd || text.startsWith(cmd + ' '));
    
    if (isAdminCmd) {
      // Проверка админа
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ Только для администраторов!');
      }
      
      // Проверка ответа на сообщение
      if (!ctx.message.reply_to_message) {
        return ctx.reply('⚠️ Ответь на сообщение пользователя!');
      }
      
      const target = ctx.message.reply_to_message.from;
      const targetUid = String(target.id);
      const targetName = target.username || 
                        `${target.first_name} ${target.last_name || ''}`.trim() || 
                        'unknown';
      
      // === СНЯТЬ ВАРН (СНЯТЬ ВАРНЫ) ===
      if (text === 'снять варн' || text === 'снять варны') {
        const user = moderator._initUser(targetUid);
        if (user.warns > 0) {
          user.warns -= 1;
          moderator._log(`[СНЯТЬ ВАРН] @${targetName} (${targetUid})`);
          await ctx.reply(
            `✅ С пользователя @${targetName} было снято предупреждение\n` +
            `📊 Текущее количество: ${user.warns}`
          );
        } else {
          await ctx.reply(`❌ У пользователя @${targetName} нет предупреждений`);
        }
        return;
      }
      
      // === ОЧИСТИТЬ ВАРНЫ ===
      if (text === 'очистить варны') {
        const user = moderator._initUser(targetUid);
        if (user.warns > 0) {
          const oldWarns = user.warns;
          user.warns = 0;
          moderator._log(`[ОЧИСТИТЬ ВАРНЫ] @${targetName} (${targetUid})`);
          await ctx.reply(
            `✅ У пользователя @${targetName} очищены все предупреждения\n` +
            `📊 Было: ${oldWarns}, Стало: 0`
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
      
      // === ВАРНЫ ===
      if (text === 'варны') {
        const user = moderator._initUser(targetUid);
        if (user.warns === 0) {
          await ctx.reply(`📊 @${targetName}\n✅ Нарушений нет`);
        } else {
          await ctx.reply(
            `📊 <b>ПРЕДУПРЕЖДЕНИЯ</b>\n\n` +
            `👤 @${targetName}\n` +
            `⚠️ Количество: ${user.warns}\n` +
            `📌 Порог бана: ${config.MODERATION.BAN_THRESHOLD}\n` +
            `🔴 Осталось до бана: ${Math.max(0, config.MODERATION.BAN_THRESHOLD - user.warns)}`,
            { parse_mode: 'HTML' }
          );
        }
        return;
      }
      
      // === МУТ ===
      if (text.startsWith('мут')) {
        const parts = rawText.split(' ');
        let minutes = 5;
        if (parts.length > 1) {
          const parsed = parseInt(parts[1]);
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
    console.log('⚙️ Версия: BLACK MODER 4.0.0');
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
