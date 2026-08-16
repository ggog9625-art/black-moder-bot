class ChatModerator {
  constructor(config) {
    this.config = config;
    this.users = new Map();
    this.logs = [];
    
    this.toxicPatterns = [
      /у?б(люд|ляд|ля|ец|ищ|оги|езд|ыд|ив)/i,
      /п[ие]зд/i,
      /х[уие]й/i,
      /м[уа]д[ае]?к/i,
      /г[ао]вн/i,
      /сучк?/i,
      /твар/i,
      /шлюх/i,
      /д[еэ]р[ьм]?мо/i,
      /еба/i,
      /хуя/i,
      /бля/i,
      /пид[оа]р?/i,
      /насиловать/i,
      /убить\s+всех/i,
      /реклама/i,
      /заработок\s+в\s+интернете/i,
      /http?s?:\/\/[^\s]+/i,
      /www\.[^\s]+/i,
      /t\.me\/[^\s]+/i,
    ];
    
    this.insultWords = [
      'тупой', 'глупый', 'дебил', 'идиот', 'кретин', 
      'олень', 'чмо', 'лох', 'обосрался', 'говно',
      'редиска', 'овца', 'баран', 'осел', 'свинья'
    ];
  }

  _initUser(uid) {
    if (!this.users.has(uid)) {
      this.users.set(uid, {
        uid: uid,
        messages: [],
        timestamps: [],
        warns: 0,
        mutedUntil: 0,
        lastAction: null,
        isBanned: false
      });
    }
    return this.users.get(uid);
  }

  _checkFlood(uid, currentTime) {
    const user = this.users.get(uid);
    if (!user) return false;
    
    const cutoff = currentTime - this.config.FLOOD_WINDOW;
    while (user.timestamps.length > 0 && user.timestamps[0] < cutoff) {
      user.timestamps.shift();
    }
    
    return user.timestamps.length >= this.config.FLOOD_MAX_MSGS;
  }

  _checkToxicity(text) {
    let score = 0;
    const lowerText = text.toLowerCase();

    // Проверка паттернов
    let hasToxic = false;
    for (const pattern of this.toxicPatterns) {
      if (pattern.test(lowerText)) {
        score += 0.3;
        hasToxic = true;
        break;
      }
    }

    // Проверка оскорбительных слов
    for (const word of this.insultWords) {
      if (lowerText.includes(word)) {
        score += 0.2;
        if (!hasToxic) hasToxic = true;
        break;
      }
    }

    // Проверка капса
    const capsCount = (text.match(/[A-ZА-Я]{3,}/g) || []).length;
    if (capsCount > 2) score += 0.1;

    // Проверка восклицаний
    const exclamationCount = (text.match(/!{3,}/g) || []).length;
    if (exclamationCount > 0) score += 0.1;

    // Проверка ссылок
    if (/https?:\/\/|www\.|t\.me|bit\.ly/i.test(text)) {
      score += 0.25;
    }

    // Проверка угроз
    const threats = ['убью', 'убить', 'смерть', 'уничтожу', 'зарежу', 'размажу', 'сожгу'];
    for (const threat of threats) {
      if (lowerText.includes(threat)) {
        score += 0.3;
        break;
      }
    }

    return Math.min(score, 1.0);
  }

  async processMessage(uid, text, chatId, username = 'unknown') {
    const currentTime = Date.now() / 1000;
    const user = this._initUser(uid);

    // Проверка на бан
    if (user.isBanned) {
      return {
        action: 'banned',
        reason: 'Пользователь забанен',
        warns: user.warns
      };
    }

    // Проверка на мут
    if (user.mutedUntil > currentTime) {
      const remaining = Math.ceil(user.mutedUntil - currentTime);
      return {
        action: 'muted',
        reason: `Мут до ${new Date(user.mutedUntil * 1000).toLocaleString()}`,
        warns: user.warns,
        remaining: remaining
      };
    }

    // Сохраняем сообщение
    user.messages.push(text);
    user.timestamps.push(currentTime);
    if (user.messages.length > 50) user.messages.shift();
    if (user.timestamps.length > 50) user.timestamps.shift();

    // Проверка на флуд
    if (this._checkFlood(uid, currentTime)) {
      user.warns += 1;
      const muteDuration = Math.min(30 * user.warns, 3600);
      user.mutedUntil = currentTime + muteDuration;
      
      this._log(`[FLOOD] ${uid} (${username}) -> mute ${muteDuration}s`);
      
      return {
        action: 'mute',
        reason: `Флуд (${this.config.FLOOD_MAX_MSGS} сообщений за ${this.config.FLOOD_WINDOW}с)`,
        duration: muteDuration,
        warns: user.warns
      };
    }

    // Проверка на токсичность
    const toxicScore = this._checkToxicity(text);
    
    if (toxicScore >= this.config.TOXIC_THRESHOLD) {
      user.warns += 1;
      
      let action = 'warn';
      let reason = 'Токсичное сообщение';
      let muteDuration = 0;
      
      // Проверка на бан
      if (user.warns >= this.config.BAN_THRESHOLD) {
        action = 'ban';
        reason = `Перманентный бан (предупреждений: ${user.warns})`;
        user.isBanned = true;
        user.mutedUntil = Infinity;
      } 
      // Проверка на мут
      else if (user.warns >= this.config.MAX_WARNS) {
        muteDuration = Math.min(30 * user.warns, 3600);
        user.mutedUntil = currentTime + muteDuration;
        action = 'mute';
        reason = `Мут на ${muteDuration}с (предупреждений: ${user.warns})`;
      }
      
      this._log(`[${action.toUpperCase()}] ${uid} (${username}): ${reason} | Score: ${toxicScore.toFixed(2)}`);
      
      return {
        action: action,
        reason: reason,
        warns: user.warns,
        toxicScore: toxicScore,
        duration: muteDuration
      };
    }

    // Всё хорошо
    return {
      action: 'allow',
      reason: 'Сообщение одобрено',
      warns: user.warns,
      toxicScore: toxicScore
    };
  }

  _log(message) {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    if (this.logs.length > 1000) this.logs.shift();
    console.log(`[MOD] ${message}`);
  }

  getUserStatus(uid) {
    const user = this.users.get(uid);
    if (!user) return null;
    
    return {
      warns: user.warns,
      isMuted: user.mutedUntil > Date.now() / 1000,
      mutedUntil: user.mutedUntil,
      isBanned: user.isBanned,
      messagesCount: user.messages.length
    };
  }

  getLogs(limit = 50) {
    return this.logs.slice(-limit);
  }

  clearWarns(uid) {
    const user = this.users.get(uid);
    if (user) {
      user.warns = 0;
      return true;
    }
    return false;
  }

  unbanUser(uid) {
    const user = this.users.get(uid);
    if (user) {
      user.isBanned = false;
      user.mutedUntil = 0;
      user.warns = 0;
      return true;
    }
    return false;
  }

  unmuteUser(uid) {
    const user = this.users.get(uid);
    if (user) {
      user.mutedUntil = 0;
      return true;
    }
    return false;
  }
}

module.exports = ChatModerator;