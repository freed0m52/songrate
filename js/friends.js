const Friends = {
  add(name, songs = []) {
    const friend = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      songs: songs
    };
    State.friends.push(friend);
    DB.saveFriends(State.friends);
    return friend;
  },

  remove(id) {
    State.friends = State.friends.filter(f => f.id !== id);
    DB.saveFriends(State.friends);
  },

  updateSongs(id, songs) {
    const f = State.friends.find(x => x.id === id);
    if (f) {
      f.songs = songs;
      DB.saveFriends(State.friends);
    }
  },

  get(id) {
    return State.friends.find(f => f.id === id) || null;
  }
};