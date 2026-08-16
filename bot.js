const { Telegraf } = require('telegraf');
const config = require('./config');
const ChatModerator = require('./moderator');

const bot = new Telegraf(config.BOT_TOKEN);
const moderator = new ChatModerator(config.MODERATION);

// ====== СТАРТ ======
bot.start(async (ctx) => {
  const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
  let msg = '🖤 <b>BLACK MODER</b> 🖤\n\n';
  msg += '👋 Привет! Я бот-модератор.\n';
  msg += '🔒 Слежу за порядком 24/7.\n\n';
  if (isAdmin) {
    msg += '🔹 <b>Команды (ответом на сообщение):</b>\n';
    msg += 'варн — предупреждение\n';
    msg += 'снять варн — снять предупреждение\n';
    msg += 'мут 5 — мут на 5 мин\n';
    msg += 'бан — бан\n';
    msg += 'размут — снять мут\n';
    msg += 'разбан — снять бан\n';
    msg += 'варны — показать варны\n';
    msg += 'кто ты — инфо о пользователе\n';
    msg += 'кто я — инфо о себе\n';
  }
  await ctx.reply(msg, { parse_mode: 'HTML' });
});

// ====== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: ОЧИСТКА ТЕКСТА ======
function cleanText(text) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ====== ОСНОВНОЙ ОБРАБОТЧИК ======
bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const uid = String(ctx.from.id);
    const lowerText = cleanText(text);

    // === КТО Я ===
    if (lowerText === 'кто я') {
      const stats = moderator.getUserStatus(uid);
      const user = ctx.from;
      let info = `🖤 <b>BLACK MODER — КТО Я</b> 🖤\n\n`;
      info += `👤 ${user.first_name || ''} ${user.last_name || ''}\n`;
      info += `📛 Состоит в чате\n\n`;
      info += `[${config.ADMIN_IDS.includes(user.id) ? '5' : '0'}] Ранг: ${config.ADMIN_IDS.includes(user.id) ? 'Создатель' : 'Простой участник'}\n`;
      info += `🏅 Репутация: 0 | ⭐ 0\n\n`;
      info += `📅 Первое появление: 01.07.2026\n`;
      info += `⏰ Последний актив: только что\n`;
      info += `📊 Сообщений: ${stats ? stats.messagesCount : 0}\n`;
      await ctx.reply(info, { parse_mode: 'HTML' });
      return;
    }

    // === ПРОВЕРКА: ЭТО КОМАНДА ДЛЯ АДМИНОВ? ===
    const isAdminCmd = ['варн', 'снять варн', 'снять варны', 'мут', 'бан', 'размут', 'разбан', 'варны', 'кто ты'].some(c => lowerText.startsWith(c));

    if (isAdminCmd) {
      // Проверка админа
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ Только для администраторов!');
      }

      // === КТО ТЫ (ответом) ===
      if (lowerText === 'кто ты') {
        if (!ctx.message.reply_to_message) return ctx.reply('⚠️ Ответь на сообщение!');
        const target = ctx.message.reply_to_message.from;
        const stats = moderator.getUserStatus(String(target.id));
        let info = `🖤 <b>BLACK MODER — КТО ТЫ</b> 🖤\n\n`;
        info += `👤 ${target.first_name || ''} ${target.last_name || ''}\n`;
        info += `📛 Состоит в чате\n\n`;
        info += `[${config.ADMIN_IDS.includes(target.id) ? '5' : '0'}] Ранг: ${config.ADMIN_IDS.includes(target.id) ? 'Создатель' : 'Простой участник'}\n`;
        info += `🏅 Репутация: 0 | ⭐ 0\n\n`;
        info += `📅 Первое появление: 01.07.2026\n`;
        info += `⏰ Последний актив: только что\n`;
        info += `📊 Сообщений: ${stats ? stats.messagesCount : 0}\n`;
        await ctx.reply(info, { parse_mode: 'HTML' });
        return;
      }

      // === ВСЕ КОМАНДЫ ТРЕБУЮТ ОТВЕТА ===
      if (!ctx.message.reply_to_message) {
        return ctx.reply('⚠️ Ответь на сообщение пользователя!');
      }

      const target = ctx.message.reply_to_message.from;
      const targetUid = String(target.id);
      const targetName = target.username || target.first_name || 'unknown';

      // === СНЯТЬ ВАРН ===
      if (lowerText === 'снять варн' || lowerText === 'снять варны') {
        const user = moderator._initUser(targetUid);
        if (user.warns > 0) {
          user.warns -= 1;
          moderator._log(`[СНЯТЬ ВАРН] @${targetName} (${targetUid})`);
          await ctx.reply(`✅ С пользователя @${targetName} снято предупреждение (было ${user.warns + 1}, стало ${user.warns})`);
        } else {
          await ctx.reply(`❌ У @${targetName} нет предупреждений`);
        }
        return;
      }

      // === ВАРН ===
      if (lowerText === 'варн') {
        const user = moderator._initUser(targetUid);
        user.warns += 1;
        let extra = '';
        if (user.warns >= config.MODERATION.BAN_THRESHOLD) {
          user.isBanned = true;
          extra = ' (автобан)';
          try { await ctx.banChatMember(targetUid); } catch(e) {}
        } else if (user.warns >= config.MODERATION.MAX_WARNS) {
          const d = Math.min(30 * user.warns, 3600);
          user.mutedUntil = Date.now() / 1000 + d;
          extra = ` (автому́т ${Math.round(d/60)} мин)`;
          try { await ctx.restrictChatMember(targetUid, { can_send_messages: false, until_date: Math.floor(Date.now()/1000 + d) }); } catch(e) {}
        }
        moderator._log(`[ВАРН] @${targetName} (${targetUid})`);
        await ctx.reply(`⚠️ @${targetName} получает предупреждение (${user.warns}/${config.MODERATION.BAN_THRESHOLD})\nБудет снято через 1 неделю\nМодератор: @${ctx.from.username || 'админ'}${extra}`);
        return;
      }

      // === МУТ ===
      if (lowerText.startsWith('мут')) {
        const parts = text.split(' ');
        let minutes = 5;
        if (parts.length > 1) {
          const parsed = parseInt(parts[1]);
          if (!isNaN(parsed) && parsed > 0) minutes = parsed;
        }
        const user = moderator._initUser(targetUid);
        const sec = minutes * 60;
        user.mutedUntil = Date.now() / 1000 + sec;
        user.warns += 1;
        try {
          await ctx.restrictChatMember(targetUid, {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            until_date: Math.floor(Date.now() / 1000 + sec)
          });
        } catch(e) {}
        moderator._log(`[МУТ] @${targetName} (${targetUid}) ${minutes} мин`);
        await ctx.reply(`🔇 @${targetName} замучен на ${minutes} минут`);
        return;
      }

      // === БАН ===
      if (lowerText === 'бан') {
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
      if (lowerText === 'размут') {
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
      if (lowerText === 'разбан') {
        moderator.unbanUser(targetUid);
        try { await ctx.unbanChatMember(targetUid); } catch(e) {}
        moderator._log(`[РАЗБАН] @${targetName} (${targetUid})`);
        await ctx.reply(`✅ @${targetName} разбанен`);
        return;
      }

      // === ВАРНЫ ===
      if (lowerText === 'варны') {
        const stats = moderator.getUserStatus(targetUid);
        if (!stats) return ctx.reply(`📊 @${targetName}\n✅ Нарушений нет`);
        await ctx.reply(
          `📊 <b>СТАТУС</b>\n\n` +
          `👤 @${targetName}\n` +
          `⚠️ Варны: ${stats.warns}\n` +
          `🔇 Мут: ${stats.isMuted ? '✅' : '❌'}\n` +
          `🚫 Бан: ${stats.isBanned ? '✅' : '❌'}`,
          { parse_mode: 'HTML' }
        );
        return;
      }
    }

    // === АВТОМОДЕРАЦИЯ ===
    if (config.ADMIN_IDS.includes(ctx.from.id)) return;
    if (ctx.message.text.startsWith('/')) return;

    const result = await moderator.processMessage(uid, text, ctx.chat.id, '');
    if (result.action === 'allow') return;

    if (result.action === 'warn') {
      await ctx.reply(`⚠️ Предупреждение #${result.warns}: ${result.reason}`);
      if (config.MODERATION.AUTO_DELETE) {
        setTimeout(() => ctx.deleteMessage().catch(()=>{}), config.MODERATION.DELETE_DELAY);
      }
    } else if (result.action === 'mute') {
      await ctx.reply(`🔇 Мут на ${result.duration} сек: ${result.reason}`);
      if (config.MODERATION.AUTO_DELETE) {
        setTimeout(() => ctx.deleteMessage().catch(()=>{}), 1000);
      }
    } else if (result.action === 'ban') {
      await ctx.reply(`🚫 Бан: ${result.reason}`);
      try { await ctx.banChatMember(ctx.from.id); } catch(e) {}
    } else if (result.action === 'muted' || result.action === 'banned') {
      try { await ctx.deleteMessage(); } catch(e) {}
    }

  } catch (error) {
    console.error('Ошибка:', error);
  }
});

// ====== ЗАПУСК ======
bot.launch()
  .then(() => console.log('🖤 BLACK MODER ЗАПУЩЕН'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
