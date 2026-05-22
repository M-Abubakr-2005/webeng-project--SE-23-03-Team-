// Mila WebSocket Client

class MilaSocket {
  constructor(roomId, onMessageCallback = null) {
    this.roomId = roomId;
    this.onMessageCallback = onMessageCallback;
    this.url = this.buildWebSocketUrl(roomId);
    this.ws = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.isManuallyClosing = false;

    this.connect();
  }

  buildWebSocketUrl(roomId) {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws/chat/${roomId}/`;
  }

  connect() {
    console.log(`[MilaSocket] Connecting to ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => this.onOpen();
      this.ws.onmessage = (e) => this.onMessage(e);
      this.ws.onclose = () => this.onClose();
      this.ws.onerror = (e) => this.onError(e);
    } catch (error) {
      console.error('[MilaSocket] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const data = { type, ...payload };
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[MilaSocket] WebSocket not ready:', this.ws?.readyState);
    }
  }

  sendMessage(content) {
    this.send('chat_message', { content });
  }

  sendTyping(isTyping) {
    this.send('typing', { is_typing: isTyping });
  }

  sendReadReceipt(messageId) {
    this.send('read_receipt', { message_id: messageId });
  }

  close() {
    this.isManuallyClosing = true;
    if (this.ws) {
      this.ws.close();
    }
  }

  onOpen() {
    console.log('[MilaSocket] Connected');
    this.reconnectDelay = 1000;
  }

  onMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('[MilaSocket] Message received:', data);

      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }

      if (data.type === 'chat_message') {
        if (this.onChatMessage) this.onChatMessage(data);
      } else if (data.type === 'typing_indicator') {
        if (this.onTypingIndicator) this.onTypingIndicator(data);
      } else if (data.type === 'presence_update') {
        if (this.onPresenceUpdate) this.onPresenceUpdate(data);
      } else if (data.type === 'read_receipt') {
        if (this.onReadReceipt) this.onReadReceipt(data);
      } else if (data.type === 'voice_call') {
        if (this.onVoiceCall) this.onVoiceCall(data);
      } else if (data.type === 'video_call') {
        if (this.onVideoCall) this.onVideoCall(data);
      } else if (data.type === 'message_deleted') {
        if (this.onMessageDeleted) this.onMessageDeleted(data);
      }
    } catch (error) {
      console.error('[MilaSocket] Message parse error:', error);
    }
  }

  onClose() {
    console.log('[MilaSocket] Connection closed');
    if (!this.isManuallyClosing) {
      this.scheduleReconnect();
    }
  }

  onError(error) {
    console.error('[MilaSocket] WebSocket error:', error);
  }

  scheduleReconnect() {
    const delay = Math.min(this.reconnectDelay, this.maxReconnectDelay);
    console.log(`[MilaSocket] Reconnecting in ${delay}ms`);

    setTimeout(() => {
      if (!this.isManuallyClosing) {
        this.reconnectDelay *= 2;
        this.connect();
      }
    }, delay);
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}
