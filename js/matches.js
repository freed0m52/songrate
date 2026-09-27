const Matches = {
  // Ключ для сравнения — регистронезависимо, с обрезкой пробелов
  key(song) {
    return (String(song.artist || '').trim().toLowerCase() +
            '|' +
            String(song.title || '').trim().toLowerCase());
  },

  compare(mySongs, friendSongs) {
    const perfect = [];              // одинаковая песня + одинаковая оценка
    const sameSongDiffScore = [];    // одинаковая песня, но разные оценки
    const sameArtist = [];           // одинаковый артист, разные песни

    const myMap = {};
    mySongs.forEach(s => { myMap[this.key(s)] = s; });

    // 1. Одинаковые песни (сравнение ТОЛЬКО по общей оценке)
    friendSongs.forEach(fs => {
      const k = this.key(fs);
      const ms = myMap[k];
      if (!ms) return;
      const myScore = Songs.calcScore(ms);
      const frScore = Songs.calcScore(fs);
      if (Math.abs(myScore - frScore) < 0.01) {
        perfect.push({ mine: ms, friend: fs });
      } else {
        sameSongDiffScore.push({ mine: ms, friend: fs });
      }
    });

    // 2. Совпадения по артистам (только треки друга, которых нет у меня)
    const myKeys = new Set(mySongs.map(s => this.key(s)));
    const myArtists = new Set(mySongs.map(s => String(s.artist || '').trim().toLowerCase()));
    friendSongs.forEach(fs => {
      const k = this.key(fs);
      if (myKeys.has(k)) return;
      if (myArtists.has(String(fs.artist || '').trim().toLowerCase())) {
        sameArtist.push({ friend: fs });
      }
    });

    // Сортировка по рейтингу
    sameSongDiffScore.sort((a, b) => Songs.calcScore(b.friend) - Songs.calcScore(a.friend));
    sameArtist.sort((a, b) => Songs.calcScore(b.friend) - Songs.calcScore(a.friend));

    return { perfect, sameSongDiffScore, sameArtist };
  }
};