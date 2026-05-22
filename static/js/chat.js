// Mila Chat Room — Complete Functionality

let socket = null;
let typingTimeout = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Chat initialized');
  console.log('Available globals:', { roomId: typeof roomId, userId: typeof userId, MilaSocket: typeof MilaSocket });

  // Get DOM elements
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const attachBtn = document.getElementById('attachBtn');
  const emojiBtn = document.getElementById('emojiBtn');
  const actionBtns = document.querySelectorAll('.action-btn');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

  console.log('🔍 Button check:', {
    messageInput: !!messageInput,
    sendBtn: !!sendBtn,
    voiceBtn: !!voiceBtn,
    attachBtn: !!attachBtn,
    emojiBtn: !!emojiBtn,
    actionBtns: actionBtns.length
  });

  // Initialize WebSocket - with proper checks
  if (typeof roomId !== 'undefined' && typeof MilaSocket !== 'undefined') {
    console.log(`📡 Connecting to room ${roomId}`);
    initWebSocket();
  } else {
    console.error('❌ Missing globals:', {
      roomId: typeof roomId,
      userId: typeof userId,
      MilaSocket: typeof MilaSocket
    });
    if (messageInput) {
      messageInput.placeholder = 'Waiting for connection...';
      messageInput.disabled = true;
    }
    if (sendBtn) {
      sendBtn.disabled = true;
    }
  }

  // Send button
  if (sendBtn && messageInput) {
    sendBtn.addEventListener('click', () => {
      sendMessage();
    });

    // Send on Enter key
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Typing indicator
    messageInput.addEventListener('input', () => {
      if (socket && socket.isConnected()) {
        sendTypingIndicator(true);
      }
    });
  }

  // Voice button - toggle recording
  if (voiceBtn) {
    voiceBtn.addEventListener('click', toggleVoiceRecord);
  }

  // Attach button
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      openFileUpload();
    });
  }

  // Emoji button
  if (emojiBtn) {
    emojiBtn.addEventListener('click', () => {
      toggleEmojiPicker();
    });
  }

  // Action buttons (call, video, more)
  actionBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const title = e.currentTarget.title;
      if (title === 'Voice Call') {
        initiateVoiceCall();
      } else if (title === 'Video Call') {
        initiateVideoCall();
      } else if (title === 'More options') {
        showMoreOptions();
      }
    });
  });

  // Mobile menu
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.chat-sidebar');
      if (sidebar) {
        sidebar.classList.toggle('open');
      }
    });
  }

  scrollToBottom();
});

function initWebSocket() {
  if (typeof MilaSocket === 'undefined') {
    console.error('❌ MilaSocket not defined');
    showNotification('❌ WebSocket not initialized', 'error');
    return;
  }

  if (!roomId) {
    console.error('❌ roomId not defined');
    showNotification('❌ Room ID missing', 'error');
    return;
  }

  console.log(`Creating MilaSocket for room ${roomId}`);
  socket = new MilaSocket(roomId);
  console.log('MilaSocket created:', socket);

  // Connection events
  socket.onOpen = function() {
    console.log('✅ Connected to chat room');
    showNotification('✅ Connected to chat', 'success');

    // Enable input
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    if (messageInput) messageInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
  };

  socket.onError = function(error) {
    console.error('❌ WebSocket error:', error);
    showNotification('⚠️ Connection error', 'error');
  };

  socket.onClose = function() {
    console.log('⚠️ Connection closed, attempting reconnect...');
    showNotification('⚠️ Disconnected, reconnecting...', 'warning');
  };

  // Message events
  socket.onChatMessage = function(data) {
    console.log('💬 Message received:', data);
    renderMessage(data);
    markMessageAsRead(data.message_id);
    scrollToBottom();
  };

  socket.onTypingIndicator = function(data) {
    if (data.user_id !== userId) {
      showTypingIndicator(data.username, data.is_typing);
    }
  };

  socket.onPresenceUpdate = function(data) {
    console.log('👤 Presence update:', data);
    updateUserPresence(data.user_id, data.is_online);
  };

  socket.onReadReceipt = function(data) {
    console.log('✓ Read receipt:', data);
    updateMessageStatus(data.message_id, 'read');
  };
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const content = messageInput.value.trim();

  if (!content) {
    showNotification('Type a message first', 'warning');
    return;
  }

  if (!socket) {
    showNotification('WebSocket not initialized', 'error');
    console.error('Socket not initialized');
    return;
  }

  if (!socket.isConnected()) {
    showNotification('Not connected to server', 'error');
    console.error('Socket not connected. State:', socket.ws?.readyState);
    return;
  }

  console.log('📤 Sending message:', content);

  try {
    socket.sendMessage(content);
    messageInput.value = '';
    messageInput.focus();
    sendTypingIndicator(false);
    showNotification('✓ Message sent', 'success');
  } catch (error) {
    console.error('❌ Error sending message:', error);
    showNotification('Failed to send message', 'error');
  }
}

function sendTypingIndicator(isTyping = true) {
  if (!socket || !socket.isConnected()) return;

  clearTimeout(typingTimeout);

  try {
    socket.sendTyping(isTyping);
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }

  if (isTyping) {
    typingTimeout = setTimeout(() => {
      if (socket && socket.isConnected()) {
        socket.sendTyping(false);
      }
    }, 3000);
  }
}

function showTypingIndicator(username, isTyping) {
  const indicator = document.getElementById('typingIndicator');
  if (!indicator) return;

  if (isTyping) {
    indicator.classList.remove('hidden');
    scrollToBottom();
  } else {
    indicator.classList.add('hidden');
  }
}

function renderMessage(data) {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;

  const isSent = data.sender.id === userId;

  // Check if message already exists
  if (document.querySelector(`.message-${data.message_id}`)) {
    return;
  }

  const messageEl = document.createElement('div');
  messageEl.className = `message-group ${isSent ? 'sent' : 'received'} message-${data.message_id}`;
  messageEl.dataset.messageId = data.message_id;

  const time = new Date(data.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  let contentHTML = '';

  if (data.msg_type === 'text') {
    contentHTML = `<div class="message-bubble">${escapeHtml(data.content)}</div>`;
  } else if (data.msg_type === 'audio') {
    contentHTML = `<div class="message-bubble msg-audio"><audio controls><source src="${data.content}" type="audio/mpeg"></audio></div>`;
  } else if (data.msg_type === 'image') {
    contentHTML = `<img src="${data.content}" alt="Image" class="msg-image">`;
  }

  if (isSent) {
    messageEl.innerHTML = `
      <div class="message-bubble-wrapper">
        ${contentHTML}
        <div class="message-meta">
          <span class="msg-time">${time}</span>
          <span class="msg-status">✓✓</span>
        </div>
      </div>
    `;
  } else {
    const avatar = data.sender.avatar || '/static/img/default-avatar.png';
    messageEl.innerHTML = `
      <img src="${avatar}" alt="${data.sender.username}" class="msg-avatar">
      <div class="message-bubble-wrapper">
        ${contentHTML}
        <div class="message-meta">
          <span class="msg-time">${time}</span>
        </div>
      </div>
    `;
  }

  // Find typing indicator and insert before it, or append
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator && typingIndicator.parentNode) {
    messagesContainer.insertBefore(messageEl, typingIndicator);
  } else {
    messagesContainer.appendChild(messageEl);
  }
}

function markMessageAsRead(messageId) {
  if (!socket || !socket.isConnected()) return;

  try {
    socket.sendReadReceipt(messageId);
  } catch (error) {
    console.error('Error sending read receipt:', error);
  }
}

function updateMessageStatus(messageId, status) {
  const messageEl = document.querySelector(`.message-${messageId}`);
  if (messageEl) {
    const statusEl = messageEl.querySelector('.msg-status');
    if (statusEl && status === 'read') {
      statusEl.textContent = '✓✓';
      statusEl.classList.add('read');
    }
  }
}

function updateUserPresence(userIdUpdate, isOnline) {
  const statusEl = document.querySelector('.user-status');
  if (statusEl) {
    if (isOnline) {
      statusEl.textContent = '🟢 Active now';
      statusEl.classList.add('online');
    } else {
      statusEl.textContent = '⚫ Last seen now';
      statusEl.classList.remove('online');
    }
  }
}

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 0);
  }
}

function toggleVoiceRecord() {
  if (isRecording) {
    // Stop recording
    isRecording = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    return;
  }

  // Start recording
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onload = () => {
          if (socket && socket.isConnected()) {
            socket.send('chat_message', {
              content: reader.result,
              msg_type: 'audio'
            });
            showNotification('🎵 Voice message sent!', 'success');
          }
        };

        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        mediaRecorder = null;
      };

      mediaRecorder.start();
      isRecording = true;
      showNotification('🎤 Recording... click again to send', 'info');
    })
    .catch(error => {
      console.error('Microphone error:', error);
      showNotification('❌ Microphone access denied', 'error');
    });
}

function showNotification(message, type = 'info') {
  // Create notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === 'success' ? '#22C55E' :
      type === 'error' ? '#EF4444' :
      type === 'warning' ? '#F59E0B' :
      '#3B82F6'
    };
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInDown 300ms ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Emoji Picker
const emojis = ['😀', '😂', '😍', '😎', '🔥', '👍', '🎉', '🚀', '💯', '✨', '😊', '😜', '🤔', '😢', '😡', '👏', '🙌', '💪', '🤝', '👋', '😴', '🤮', '😷', '🤗', '😘'];

function toggleEmojiPicker() {
  console.log('🎯 Emoji picker clicked');
  let picker = document.getElementById('emojiPicker');

  if (!picker) {
    picker = document.createElement('div');
    picker.id = 'emojiPicker';
    picker.style.cssText = `
      position: absolute;
      bottom: 60px;
      left: 50px;
      background: var(--bg-glass);
      border: 1px solid rgba(29,158,117,0.2);
      border-radius: var(--radius-lg);
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      z-index: 1000;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    `;

    emojis.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.style.cssText = `
        border: none;
        background: rgba(29,158,117,0.1);
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 8px;
        transition: all 200ms;
      `;
      btn.onmouseover = () => btn.style.transform = 'scale(1.2)';
      btn.onmouseout = () => btn.style.transform = 'scale(1)';
      btn.onclick = () => {
        const input = document.getElementById('messageInput');
        input.value += emoji;
        input.focus();
        picker.remove();
      };
      picker.appendChild(btn);
    });

    document.body.appendChild(picker);
  } else {
    picker.remove();
  }
}

// File Upload
function openFileUpload() {
  console.log('📎 File upload clicked');
  let input = document.getElementById('fileInput');
  if (!input) {
    input = document.createElement('input');
    input.id = 'fileInput';
    input.type = 'file';
    input.style.display = 'none';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.type.startsWith('image/')) {
          handleImageUpload(file);
        } else {
          showNotification(`📎 ${file.name} - upload ready`, 'info');
        }
      }
    };
    document.body.appendChild(input);
  }
  input.click();
}

function handleImageUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    if (socket && socket.isConnected()) {
      socket.send('chat_message', { content, msg_type: 'image' });
      showNotification('📸 Image sent!', 'success');
    }
  };
  reader.readAsDataURL(file);
}

// Voice Call
function initiateVoiceCall() {
  const otherUser = document.querySelector('.user-info h2')?.textContent;
  showNotification(`📞 Calling ${otherUser}...`, 'info');
  // In a real implementation, this would connect to a WebRTC service
  console.log('Voice call initiated');
}

// Video Call
function initiateVideoCall() {
  const otherUser = document.querySelector('.user-info h2')?.textContent;
  showNotification(`📹 Starting video call with ${otherUser}...`, 'info');
  // In a real implementation, this would connect to a WebRTC service
  console.log('Video call initiated');
}

// More Options
function showMoreOptions() {
  const menu = document.createElement('div');
  menu.style.cssText = `
    position: absolute;
    top: 60px;
    right: 20px;
    background: var(--bg-glass);
    border: 1px solid rgba(29,158,117,0.2);
    border-radius: var(--radius-lg);
    padding: 8px 0;
    min-width: 200px;
    z-index: 1000;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  `;

  const options = [
    { icon: '📌', label: 'Pin Message', action: () => showNotification('📌 Pin feature coming soon', 'info') },
    { icon: '🔍', label: 'Search', action: () => showNotification('🔍 Search feature coming soon', 'info') },
    { icon: '📋', label: 'Info', action: () => showNotification('ℹ️ Group info coming soon', 'info') },
    { icon: '🔔', label: 'Notifications', action: () => showNotification('🔔 Muted', 'success') },
    { icon: '⚙️', label: 'Settings', action: () => window.location.href = '/settings/' },
  ];

  options.forEach(opt => {
    const btn = document.createElement('div');
    btn.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      transition: all 200ms;
      display: flex;
      gap: 12px;
      align-items: center;
      color: var(--text-primary);
      font-size: 0.95rem;
    `;
    btn.innerHTML = `<span>${opt.icon}</span><span>${opt.label}</span>`;
    btn.onmouseover = () => btn.style.background = 'rgba(29,158,117,0.1)';
    btn.onmouseout = () => btn.style.background = 'transparent';
    btn.onclick = () => {
      opt.action();
      menu.remove();
    };
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
  setTimeout(() => menu.remove(), 5000);
}

console.log('✅ Chat.js loaded with all features');
