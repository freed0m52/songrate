// ===== Локальная "БД" на localStorage =====
const DB = {
  KEY_SONGS:   'mra_songs',
  KEY_FRIENDS: 'mra_friends',
  KEY_THEME:   'mra_theme',

  loadSongs() {
    try { return JSON.parse(localStorage.getItem(this.KEY_SONGS)) || []; }
    catch { return []; }
  },
  saveSongs(songs) {
    localStorage.setItem(this.KEY_SONGS, JSON.stringify(songs));
  },
  loadFriends() {
    try { return JSON.parse(localStorage.getItem(this.KEY_FRIENDS)) || []; }
    catch { return []; }
  },
  saveFriends(friends) {
    localStorage.setItem(this.KEY_FRIENDS, JSON.stringify(friends));
  },
  loadTheme() { return localStorage.getItem(this.KEY_THEME) || 'dark'; },
  saveTheme(theme) { localStorage.setItem(this.KEY_THEME, theme); }
};