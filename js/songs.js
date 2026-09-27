const Songs = {
  // Проверка дубликата (регистронезависимо)
  exists(artist, title, list, excludeId = null) {
    const a = artist.trim().toLowerCase();
    const t = title.trim().toLowerCase();
    return list.some(s =>
      s.id !== excludeId &&
      s.artist.trim().toLowerCase() === a &&
      s.title.trim().toLowerCase() === t
    );
  },

  // Расчёт рейтинга
  // Обычная песня: музыка (0-10) + текст (0-10) + вайб (0-20) = 40
  // Без текста: (музыка + вайб) * 4/3 → 30 * 4/3 = 40
  calcScore(song) {
    const music = Number(song.music) || 0;
    const text  = Number(song.text)  || 0;
    const vibe  = Number(song.vibe)  || 0;
    let score;
    if (song.noText) {
      score = (music + vibe) * (40 / 30);
    } else {
      score = music + text + vibe;
    }
    if (score > 40) score = 40;
    return Math.round(score * 10) / 10;
  },

  isGold(song) {
    return this.calcScore(song) >= 40;
  },

  // Создать объект песни
  create(data) {
    return {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      artist: data.artist,
      title: data.title,
      music: data.music,
      text: data.text,
      vibe: data.vibe,
      noText: !!data.noText,
      tags: data.tags || [],
      addedAt: Date.now()
    };
  },

  // Сортировка по рейтингу
  sortByScore(list) {
    return [...list].sort((a, b) => this.calcScore(b) - this.calcScore(a));
  },

  // Только один "лучший трек" на артиста
  normalizeBestTracks(list) {
    const byArtist = {};
    const sortedByAdd = [...list].sort((a, b) => a.addedAt - b.addedAt);
    sortedByAdd.forEach(s => {
      if (s.tags && s.tags.includes('best')) {
        const key = s.artist.trim().toLowerCase();
        byArtist[key] = s.id;
      }
    });
    list.forEach(s => {
      const key = s.artist.trim().toLowerCase();
      if (s.tags && s.tags.includes('best')) {
        if (byArtist[key] !== s.id) {
          s.tags = s.tags.filter(t => t !== 'best');
        }
      }
    });
  },

  // Человеко-читаемые названия тегов
  TAG_LABELS: {
    concert:  'Концертник',
    live:     'Хочется жить',
    die:      'Хочется умереть',
    best:     'Лучший трек',
    favorite: 'Любимый трек'
  },

  tagLabel(tag) {
    return this.TAG_LABELS[tag] || tag;
  }
};