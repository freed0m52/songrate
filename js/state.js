// ===== Глобальное состояние =====
const State = {
  songs: [],              // мои песни
  friends: [],            // [{id, name, songs:[]}]
  currentFriendId: null,  // null = мой профиль
  dirty: false,           // были ли изменения с момента сохранения/загрузки
  editingSongId: null,    // id редактируемой песни
  pendingFriendUploadId: null, // id друга, для которого ждём загрузку JSON

  isMine() { return this.currentFriendId === null; },

  // Текущий отображаемый список песен
  currentSongs() {
    if (this.isMine()) return this.songs;
    const f = this.friends.find(x => x.id === this.currentFriendId);
    return f ? f.songs : [];
  },

  markDirty() { this.dirty = true; },
  clearDirty() { this.dirty = false; }
};