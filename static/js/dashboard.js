// Dashboard Functionality

let presenceSocket = null;

document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('searchBar');
  const conversationItems = document.querySelectorAll('.conversation-item');

  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();

      conversationItems.forEach((item) => {
        const name = item.querySelector('.conversation-header h3')?.textContent.toLowerCase() || '';
        const preview = item.querySelector('.conversation-preview')?.textContent.toLowerCase() || '';

        const matches = name.includes(searchTerm) || preview.includes(searchTerm);
        item.style.display = matches || searchTerm === '' ? 'flex' : 'none';
      });
    });
  }

  // Set active conversation
  conversationItems.forEach((item) => {
    item.addEventListener('click', () => {
      conversationItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Mobile sidebar toggle
  const hamburger = document.getElementById('sidebarToggle');
  if (hamburger) {
    hamburger.addEventListener('click', toggleSidebar);
  }

  // Initialize presence WebSocket (single persistent connection)
  initPresenceSocket();
});

function initPresenceSocket() {
  if (presenceSocket) return; // Already connected

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  presenceSocket = new WebSocket(`${proto}://${location.host}/ws/presence/`);

  presenceSocket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'presence_update') {
        updateUserStatus(data.user_id, data.is_online);
      }
    } catch (error) {
      console.error('[Presence] Message parse error:', error);
    }
  };

  presenceSocket.onerror = (e) => {
    console.error('[Presence] WebSocket error:', e);
  };

  presenceSocket.onclose = () => {
    console.log('[Presence] Connection closed, will reconnect in 5s');
    presenceSocket = null;
    setTimeout(initPresenceSocket, 5000);
  };
}

function updateUserStatus(userId, isOnline) {
  // Update online indicators in story row
  document.querySelectorAll(`[data-user-id="${userId}"]`).forEach((element) => {
    const onlineDot = element.querySelector('.online-dot');
    if (onlineDot) {
      onlineDot.style.display = isOnline ? 'inline-block' : 'none';
    }
  });

  // Update in conversations list
  const conversationItems = document.querySelectorAll('.conversation-item');
  conversationItems.forEach((item) => {
    if (item.dataset.userId === String(userId)) {
      const dot = item.querySelector('.online-dot');
      if (dot) {
        dot.style.display = isOnline ? 'inline-block' : 'none';
      }
    }
  });
}

// Mobile sidebar toggle
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}
