const UI = {
  els: {},

  init() {
    this.els = {
      songList:      document.getElementById('song-list'),
      appTitle:      document.getElementById('app-title'),
      btnHome:       document.getElementById('btn-home'),
      btnAdd:        document.getElementById('btn-add'),
      btnUpload:     document.getElementById('btn-upload'),
      btnFriends:    document.getElementById('btn-friends'),
      btnMatches:    document.getElementById('btn-matches'),
      btnTheme:      document.getElementById('btn-theme'),
      btnSaveJson:   document.getElementById('btn-save-json'),
      fileInput:     document.getElementById('file-input'),
      friendFileInput: document.getElementById('friend-file-input'),

      modalSong:     document.getElementById('modal-song'),
      songModalTitle:document.getElementById('song-modal-title'),
      inpArtist:     document.getElementById('inp-artist'),
      inpTitle:      document.getElementById('inp-title'),
      inpMusic:      document.getElementById('inp-music'),
      inpText:       document.getElementById('inp-text'),
      inpVibe:       document.getElementById('inp-vibe'),
      inpNoText:     document.getElementById('inp-no-text'),
      valMusic:      document.getElementById('val-music'),
      valText:       document.getElementById('val-text'),
      valVibe:       document.getElementById('val-vibe'),
      btnSaveSong:   document.getElementById('btn-save-song'),
      btnCancelSong: document.getElementById('btn-cancel-song'),

      modalFriends:  document.getElementById('modal-friends'),
      friendList:    document.getElementById('friend-list'),
      inpFriendName: document.getElementById('inp-friend-name'),
      btnAddFriend:  document.getElementById('btn-add-friend'),
      btnCloseFriends: document.getElementById('btn-close-friends'),

      modalMatchPicker: document.getElementById('modal-match-picker'),
      matchFriendSelect: document.getElementById('match-friend-select'),
      btnCompare:    document.getElementById('btn-compare'),
      btnCloseMatchPicker: document.getElementById('btn-close-match-picker'),

      modalMatchesResult: document.getElementById('modal-matches-result'),
      matchesTitle:  document.getElementById('matches-title'),
      matchesResult: document.getElementById('matches-result'),
      btnCloseMatches: document.getElementById('btn-close-matches'),
      btnBackToPicker: document.getElementById('btn-back-to-picker'),

      modalTheme:    document.getElementById('modal-theme'),
      themePicker:   document.getElementById('theme-picker'),
      btnCloseTheme: document.getElementById('btn-close-theme')
    };
  },

  // ===== Рендер списка песен =====
  renderSongs() {
    const list = this.els.songList;
    const songs = Songs.sortByScore(State.currentSongs());

    if (State.isMine()) Songs.normalizeBestTracks(State.songs);

    if (State.isMine()) {
      this.els.appTitle.textContent = 'Мои треки';
      this.els.btnHome.classList.add('hidden');
      this.els.btnAdd.classList.remove('hidden');
      this.els.btnUpload.classList.remove('hidden');
      this.els.btnUpload.title = 'Загрузить мой JSON';
    } else {
      const f = Friends.get(State.currentFriendId);
      this.els.appTitle.textContent = f ? ('Треки: ' + f.name) : 'Друг';
      this.els.btnHome.classList.remove('hidden');
      this.els.btnAdd.classList.add('hidden');
      this.els.btnUpload.classList.remove('hidden');
      this.els.btnUpload.title = 'Обновить JSON друга';
    }

    list.innerHTML = '';
    if (songs.length === 0) {
      const div = document.createElement('div');
      div.className = 'empty-state';
      div.textContent = State.isMine()
        ? 'Тут пусто. Добавь первый трек ➕'
        : 'У друга нет треков. Загрузи его JSON кнопкой 📂';
      list.appendChild(div);
      this.updateSaveButton();
      return;
    }

    songs.forEach(song => {
      list.appendChild(this.buildSongCard(song));
    });

    this.updateSaveButton();
  },

  buildSongCard(song) {
    const card = document.createElement('div');
    const gold = Songs.isGold(song);
    card.className = 'song-card' + (gold ? ' gold' : '');

    const info = document.createElement('div');
    info.className = 'song-info';

    const title = document.createElement('div');
    title.className = 'song-title';
    const best = song.tags && song.tags.includes('best');
    const fav  = song.tags && song.tags.includes('favorite');
    title.textContent = (best ? '👑 ' : '') + song.title + (fav ? ' ❤️' : '');

    const artist = document.createElement('div');
    artist.className = 'song-artist';
    artist.textContent = song.artist;

    info.appendChild(title);
    info.appendChild(artist);

    const score = document.createElement('div');
    score.className = 'song-score';
    score.textContent = Songs.calcScore(song) + '/40';

    card.appendChild(info);
    card.appendChild(score);

    if (State.isMine()) {
      const actions = document.createElement('div');
      actions.className = 'song-actions';
      const btnEdit = document.createElement('button');
      btnEdit.textContent = '✏️';
      btnEdit.title = 'Редактировать';
      btnEdit.onclick = () => this.openSongModal(song);
      const btnDel = document.createElement('button');
      btnDel.textContent = '🗑️';
      btnDel.title = 'Удалить';
      btnDel.onclick = () => {
        if (!confirm('Удалить "' + song.title + '"?')) return;
        State.songs = State.songs.filter(s => s.id !== song.id);
        DB.saveSongs(State.songs);
        State.markDirty();
        this.renderSongs();
      };
      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);
      card.appendChild(actions);
    }

    return card;
  },

  updateSaveButton() {
    if (State.isMine() && State.dirty) {
      this.els.btnSaveJson.classList.remove('hidden');
    } else {
      this.els.btnSaveJson.classList.add('hidden');
    }
  },

  // ===== Модалка песни =====
  openSongModal(song = null) {
    State.editingSongId = song ? song.id : null;
    this.els.songModalTitle.textContent = song ? 'Редактировать песню' : 'Новая песня';

    this.els.inpArtist.value = song ? song.artist : '';
    this.els.inpTitle.value  = song ? song.title  : '';
    this.els.inpMusic.value  = song ? song.music  : 5;
    this.els.inpText.value   = song ? song.text   : 5;
    this.els.inpVibe.value   = song ? song.vibe   : 10;
    this.els.inpNoText.checked = song ? !!song.noText : false;

    this.updateSliderLabels();
    this.toggleNoText();

    document.querySelectorAll('#modal-song [data-tag]').forEach(cb => {
      cb.checked = song && song.tags ? song.tags.includes(cb.dataset.tag) : false;
    });

    this.els.modalSong.classList.remove('hidden');
  },

  closeSongModal() {
    this.els.modalSong.classList.add('hidden');
    State.editingSongId = null;
  },

  updateSliderLabels() {
    this.els.valMusic.textContent = this.els.inpMusic.value;
    this.els.valText.textContent  = this.els.inpText.value;
    this.els.valVibe.textContent  = this.els.inpVibe.value;
  },

  toggleNoText() {
    const off = this.els.inpNoText.checked;
    const row = this.els.inpText.closest('.slider-row');
    if (off) row.classList.add('disabled-slider');
    else row.classList.remove('disabled-slider');
    this.els.inpText.disabled = off;
  },

  // ===== Друзья =====
  renderFriends() {
    const list = this.els.friendList;
    list.innerHTML = '';
    if (State.friends.length === 0) {
      const d = document.createElement('div');
      d.className = 'empty-state';
      d.style.padding = '20px';
      d.textContent = 'Пока нет друзей';
      list.appendChild(d);
      return;
    }
    State.friends.forEach(f => {
      const card = document.createElement('div');
      card.className = 'friend-card';

      const name = document.createElement('div');
      name.className = 'friend-name';
      name.textContent = f.name + ' (' + f.songs.length + ')';

      const actions = document.createElement('div');
      actions.className = 'friend-actions';

      const btnOpen = document.createElement('button');
      btnOpen.textContent = 'Открыть';
      btnOpen.onclick = () => {
        State.currentFriendId = f.id;
        this.closeFriends();
        this.renderSongs();
      };

      const btnUpload = document.createElement('button');
      btnUpload.className = 'secondary';
      btnUpload.textContent = '📂';
      btnUpload.title = 'Обновить JSON';
      btnUpload.onclick = () => {
        State.pendingFriendUploadId = f.id;
        this.els.friendFileInput.value = '';
        this.els.friendFileInput.click();
      };

      const btnDel = document.createElement('button');
      btnDel.className = 'secondary';
      btnDel.textContent = '🗑️';
      btnDel.onclick = () => {
        if (!confirm('Удалить друга ' + f.name + '?')) return;
        Friends.remove(f.id);
        if (State.currentFriendId === f.id) {
          State.currentFriendId = null;
          this.renderSongs();
        }
        this.renderFriends();
      };

      actions.appendChild(btnOpen);
      actions.appendChild(btnUpload);
      actions.appendChild(btnDel);

      card.appendChild(name);
      card.appendChild(actions);
      list.appendChild(card);
    });
  },

  closeFriends() { this.els.modalFriends.classList.add('hidden'); },

  // ===== Мэтчи — шаг 1: выбор друга =====
  openMatchPicker() {
    if (State.friends.length === 0) {
      alert('Сначала добавь друзей');
      return;
    }
    const sel = this.els.matchFriendSelect;
    sel.innerHTML = '';
    State.friends.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      sel.appendChild(opt);
    });
    this.els.modalMatchPicker.classList.remove('hidden');
  },

  closeMatchPicker() { this.els.modalMatchPicker.classList.add('hidden'); },

  // ===== Мэтчи — шаг 2: результат =====
  openMatchesResult(friendId) {
    const friend = Friends.get(friendId);
    if (!friend) return;
    this.els.matchesTitle.textContent = 'Ты vs ' + friend.name;
    this.renderMatches(friendId);
    this.els.modalMatchPicker.classList.add('hidden');
    this.els.modalMatchesResult.classList.remove('hidden');
  },

  renderMatches(friendId) {
    const friend = Friends.get(friendId);
    if (!friend) return;
    const { perfect, sameSongDiffScore, sameArtist } = Matches.compare(State.songs, friend.songs);

    const out = this.els.matchesResult;
    out.innerHTML = '';

    if (perfect.length === 0 && sameSongDiffScore.length === 0 && sameArtist.length === 0) {
      out.innerHTML = '<div class="empty-state">Совпадений не найдено 😐</div>';
      return;
    }

    // 1. Идеальные — одинаковые песни + одинаковый рейтинг
    if (perfect.length) {
      const sec = document.createElement('div');
      sec.className = 'match-section';
      sec.innerHTML = '<h3>🎯 Идеальные совпадения</h3>';
      perfect
        .sort((a, b) => Songs.calcScore(b.mine) - Songs.calcScore(a.mine))
        .forEach(({ mine, friend: fs }) => {
          sec.appendChild(this.buildMatchCard(mine, fs, { perfect: true }));
        });
      out.appendChild(sec);
    }

    // 2. Одинаковые песни, разные оценки
    if (sameSongDiffScore.length) {
      const sec = document.createElement('div');
      sec.className = 'match-section';
      sec.innerHTML = '<h3>🎵 Одинаковые песни, разные оценки</h3>';
      sameSongDiffScore.forEach(({ mine, friend: fs }) => {
        sec.appendChild(this.buildMatchCard(mine, fs, { perfect: false }));
      });
      out.appendChild(sec);
    }

    // 3. Совпадения по артистам
    if (sameArtist.length) {
      const sec = document.createElement('div');
      sec.className = 'match-section';
      sec.innerHTML = `<h3>🎤 Твой друг также добавил песни твоих любимых артистов</h3>`;
      sameArtist.forEach(({ friend: fs }) => {
        const row = document.createElement('div');
        row.className = 'match-artist-row';
        const best = fs.tags && fs.tags.includes('best');
        const fav  = fs.tags && fs.tags.includes('favorite');
        row.innerHTML =
          `<span><b>${this.esc(fs.title)}</b> ${best ? '👑' : ''}${fav ? ' ❤️' : ''} — ${this.esc(fs.artist)}</span>
           <span><b>${Songs.calcScore(fs)}/40</b></span>`;
        sec.appendChild(row);
      });
      out.appendChild(sec);
    }
  },

  // Карточка сравнения одного трека (две строки тегов)
  buildMatchCard(mine, friend, opts = {}) {
    const card = document.createElement('div');
    card.className = 'match-card' + (opts.perfect ? ' perfect' : '');

    const myScore = Songs.calcScore(mine);
    const frScore = Songs.calcScore(friend);

    const bestMine = mine.tags && mine.tags.includes('best');
    const favMine  = mine.tags && mine.tags.includes('favorite');
    const bestFr   = friend.tags && friend.tags.includes('best');
    const favFr    = friend.tags && friend.tags.includes('favorite');

    // Заголовок: название + артист + справа баллы
    const header = document.createElement('div');
    header.className = 'match-card-header';

    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'match-card-title';
    // Показываем название как у тебя (регистр сохранён), но сравнение было регистронезависимым
    const titleText = mine.title;
    const bestIcon = (bestMine || bestFr) ? '👑 ' : '';
    const favIcon  = (favMine || favFr)   ? ' ❤️' : '';
    title.innerHTML = `${bestIcon}${this.esc(titleText)}${favIcon}${opts.perfect ? '<span class="match-badge">Идеально</span>' : ''}`;

    const artist = document.createElement('div');
    artist.className = 'match-card-artist';
    artist.textContent = mine.artist;

    left.appendChild(title);
    left.appendChild(artist);

    const scores = document.createElement('div');
    scores.className = 'match-card-scores';
    scores.innerHTML =
      `Друг: <b class="score-friend">${frScore}/40</b><br>` +
      `Ты: <b class="score-mine">${myScore}/40</b>`;

    header.appendChild(left);
    header.appendChild(scores);
    card.appendChild(header);

    // Полоска тегов: сверху — выбор друга, снизу — твой
    const tags = document.createElement('div');
    tags.className = 'match-tags';
    tags.appendChild(this.buildTagsRow('Друг:', friend.tags || []));
    tags.appendChild(this.buildTagsRow('Ты:',   mine.tags   || []));
    card.appendChild(tags);

    return card;
  },

  buildTagsRow(label, tagList) {
    const row = document.createElement('div');
    row.className = 'tags-row';

    const lbl = document.createElement('span');
    lbl.className = 'tags-label';
    lbl.textContent = label;
    row.appendChild(lbl);

    if (!tagList.length) {
      const chip = document.createElement('span');
      chip.className = 'tag-chip empty';
      chip.textContent = 'нет';
      row.appendChild(chip);
      return row;
    }

    tagList.forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = Songs.tagLabel(t);
      row.appendChild(chip);
    });
    return row;
  },

  esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
};