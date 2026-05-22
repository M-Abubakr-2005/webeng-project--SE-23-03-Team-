// Mila Notifications System

class NotificationManager {
  constructor() {
    this.toastContainer = null;
    this.initContainer();
  }

  initContainer() {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: var(--spacing-lg);
        right: var(--spacing-lg);
        z-index: var(--z-tooltip);
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(this.toastContainer);
    }
  }

  show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-left: 4px solid ${this.getColorForType(type)};
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      color: var(--text-primary);
      font-size: var(--font-size-md);
      pointer-events: auto;
      cursor: pointer;
    `;
    toast.textContent = message;
    toast.classList.add('toast-enter');

    this.toastContainer.appendChild(toast);

    toast.addEventListener('click', () => this.remove(toast));

    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }
  }

  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    this.show(message, 'error', duration);
  }

  warning(message, duration = 4000) {
    this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }

  remove(toast) {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  getColorForType(type) {
    const colors = {
      success: 'var(--color-success)',
      error: 'var(--color-error)',
      warning: 'var(--color-warning)',
      info: 'var(--teal-500)',
    };
    return colors[type] || colors.info;
  }
}

const notifications = new NotificationManager();
