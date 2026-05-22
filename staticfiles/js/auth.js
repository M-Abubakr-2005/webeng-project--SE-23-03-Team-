// Form Validation & Auth

function validateRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return false;

  const fullName = form.full_name?.value?.trim() || '';
  const email = form.email?.value?.trim() || '';
  const password = form.password?.value || '';
  const confirmPassword = form.confirm_password?.value || '';

  const isValid =
    fullName.length >= 3 &&
    email.includes('@') &&
    email.length > 5 &&
    password.length >= 8 &&
    password === confirmPassword &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

  const btn = document.getElementById('registerBtn');
  if (btn) {
    btn.disabled = !isValid;
  }

  return isValid;
}

function updatePasswordStrength() {
  const password = document.getElementById('id_password').value;
  const fill = document.getElementById('strengthFill');
  const hint = document.getElementById('passwordHint');

  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[!@#$%^&*]/.test(password)) strength += 25;

  fill.style.width = strength + '%';

  if (strength < 50) {
    fill.style.background = 'var(--color-error)';
    hint.textContent = '⚠️ Weak password';
  } else if (strength < 75) {
    fill.style.background = 'var(--color-warning)';
    hint.textContent = '✓ Fair password';
  } else {
    fill.style.background = 'var(--color-success)';
    hint.textContent = '✓ Strong password';
  }
}

function togglePassword(e) {
  e.preventDefault();
  const btn = e.currentTarget;
  const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');

  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    btn.classList.add('active');
  } else {
    input.type = 'password';
    btn.classList.remove('active');
  }
}
