window.addEventListener('DOMContentLoaded', () => {
  // ===== Инициализация =====
  UI.init();
  Themes.apply(DB.loadTheme());
  State.songs   = DB.loadSongs();
  State.friends = DB.loadFriends();
  State.currentFriendId = null;
  State.dirty = false;

  UI.renderSongs();

  // ===== Кнопки верхней панели =====
  UI.els.btnAdd.onclick = () => {
    if (!State.isMine()) return;
    UI.openSongModal();
  };

  UI.els.btnHome.onclick = () => {
    State.currentFriendId = null;
    UI.renderSongs();
  };

  // Загрузка JSON — верхняя кнопка 📂
  UI.els.btnUpload.onclick = () => {
    if (State.isMine()) {
      UI.els.fileInput.value = '';
      UI.els.fileInput.click();
    } else {
      State.pendingFriendUploadId = State.currentFriendId;
      UI.els.friendFileInput.value = '';
      UI.els.friendFileInput.click();
    }
  };

  // ---- Импорт своих песен ----
  UI.els.fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const songs = Array.isArray(data) ? data : (data.songs || []);
        if (!Array.isArray(songs)) throw new Error('Неверный формат');
        State.songs = songs.map(s => ({
          id: s.id || ('s_' + Date.now() + '_' + Math.random().toString(36).slice(2,7)),
          artist: s.artist || '',
          title: s.title || '',
          music: Number(s.music) || 0,
          text: Number(s.text) || 0,
          vibe: Number(s.vibe) || 0,
          noText: !!s.noText,
          tags: Array.isArray(s.tags) ? s.tags : [],
          addedAt: s.addedAt || Date.now()
        }));
        DB.saveSongs(State.songs);
        State.clearDirty();
        UI.renderSongs();
        alert('Загружено треков: ' + State.songs.length);
      } catch (err) {
        alert('Ошибка чтения JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // ---- Импорт JSON друга ----
  UI.els.friendFileInput.onchange = (e) => {
    const file = e.target.files[0];
    const friendId = State.pendingFriendUploadId;
    State.pendingFriendUploadId = null;
    if (!file || !friendId) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const songs = Array.isArray(data) ? data : (data.songs || []);
        if (!Array.isArray(songs)) throw new Error('Неверный формат');
        const normalized = songs.map(s => ({
          id: s.id || ('s_' + Date.now() + '_' + Math.random().toString(36).slice(2,7)),
          artist: s.artist || '',
          title: s.title || '',
          music: Number(s.music) || 0,
          text: Number(s.text) || 0,
          vibe: Number(s.vibe) || 0,
          noText: !!s.noText,
          tags: Array.isArray(s.tags) ? s.tags : [],
          addedAt: s.addedAt || Date.now()
        }));
        Friends.updateSongs(friendId, normalized);
        UI.renderFriends();
        if (State.currentFriendId === friendId) UI.renderSongs();
        alert('Обновлено треков друга: ' + normalized.length);
      } catch (err) {
        alert('Ошибка чтения JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Кнопка сохранения в JSON
  UI.els.btnSaveJson.onclick = () => {
    const blob = new Blob([JSON.stringify(State.songs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-tracks.json';
    a.click();
    URL.revokeObjectURL(url);
    State.clearDirty();
    UI.updateSaveButton();
  };

  // ===== Модалка песни =====
  ['inpMusic','inpText','inpVibe'].forEach(id => {
    UI.els[id].addEventListener('input', () => UI.updateSliderLabels());
  });
  UI.els.inpNoText.addEventListener('change', () => UI.toggleNoText());
  UI.els.btnCancelSong.onclick = () => UI.closeSongModal();

  UI.els.btnSaveSong.onclick = () => {
    const artist = UI.els.inpArtist.value.trim();
    const title  = UI.els.inpTitle.value.trim();
    if (!artist || !title) {
      alert('Заполни исполнителя и название');
      return;
    }

    if (Songs.exists(artist, title, State.songs, State.editingSongId)) {
      alert('Такая песня уже есть (совпадают исполнитель и название)');
      return;
    }

    const noText = UI.els.inpNoText.checked;
    const tags = [];
    document.querySelectorAll('#modal-song [data-tag]').forEach(cb => {
      if (cb.checked) tags.push(cb.dataset.tag);
    });

    const data = {
      artist,
      title,
      music: Number(UI.els.inpMusic.value),
      text:  noText ? 0 : Number(UI.els.inpText.value),
      vibe:  Number(UI.els.inpVibe.value),
      noText,
      tags
    };

    if (State.editingSongId) {
      const s = State.songs.find(x => x.id === State.editingSongId);
      if (s) Object.assign(s, data);
    } else {
      State.songs.push(Songs.create(data));
    }

    Songs.normalizeBestTracks(State.songs);

    DB.saveSongs(State.songs);
    State.markDirty();
    UI.closeSongModal();
    UI.renderSongs();
  };

  // ===== Друзья =====
  UI.els.btnFriends.onclick = () => {
    UI.renderFriends();
    UI.els.modalFriends.classList.remove('hidden');
  };
  UI.els.btnCloseFriends.onclick = () => UI.closeFriends();

  UI.els.btnAddFriend.onclick = () => {
    const name = UI.els.inpFriendName.value.trim();
    if (!name) { alert('Введи имя'); return; }
    Friends.add(name);
    UI.els.inpFriendName.value = '';
    UI.renderFriends();
  };

  // ===== Мэтчи =====
  UI.els.btnMatches.onclick = () => UI.openMatchPicker();
  UI.els.btnCloseMatchPicker.onclick = () => UI.closeMatchPicker();
  UI.els.btnCompare.onclick = () => {
    const id = UI.els.matchFriendSelect.value;
    if (!id) return;
    UI.openMatchesResult(id);
  };

  UI.els.btnCloseMatches.onclick = () => {
    UI.els.modalMatchesResult.classList.add('hidden');
  };
  UI.els.btnBackToPicker.onclick = () => {
    UI.els.modalMatchesResult.classList.add('hidden');
    UI.els.modalMatchPicker.classList.remove('hidden');
  };

  // ===== Тема =====
  UI.els.btnTheme.onclick = () => {
    Themes.renderPicker(UI.els.themePicker);
    UI.els.modalTheme.classList.remove('hidden');
  };
  UI.els.btnCloseTheme.onclick = () => UI.els.modalTheme.classList.add('hidden');

  // Закрытие по клику на фон — только служебные модалки
  ['modal-friends', 'modal-theme', 'modal-match-picker', 'modal-matches-result'].forEach(id => {
    const m = document.getElementById(id);
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.add('hidden');
    });
  });
});