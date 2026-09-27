const Themes = {
  list: [
    { id: 'dark',   name: 'Тёмная',  color: '#111' },
    { id: 'light',  name: 'Светлая', color: '#f4f4f8' },
    { id: 'neon',   name: 'Неон',    color: '#ff2fd0' },
    { id: 'sunset', name: 'Закат',   color: '#ff7b54' },
    { id: 'ocean',  name: 'Океан',   color: '#28c8ff' },
    { id: 'forest', name: 'Лес',     color: '#4ade80' }
  ],

  apply(themeId) {
    document.body.setAttribute('data-theme', themeId);
    DB.saveTheme(themeId);
  },

  renderPicker(container, onSelect) {
    container.innerHTML = '';
    const active = document.body.getAttribute('data-theme');
    this.list.forEach(t => {
      const el = document.createElement('div');
      el.className = 'theme-swatch' + (t.id === active ? ' active' : '');
      el.style.background = t.color;
      el.textContent = t.name;
      el.onclick = () => {
        this.apply(t.id);
        container.querySelectorAll('.theme-swatch').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        if (onSelect) onSelect(t.id);
      };
      container.appendChild(el);
    });
  }
};