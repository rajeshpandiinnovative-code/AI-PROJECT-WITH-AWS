// Cross-browser form handling with mobile support
const form = document.getElementById('demoLoginForm');
const statusBox = document.getElementById('demoStatus');

// Add touch support for mobile devices
if ('ontouchstart' in window) {
  document.body.classList.add('touch-device');
}

// Form validation with better mobile keyboard handling
form.addEventListener('submit', async event => {
  event.preventDefault();

  // Clear any previous status
  statusBox.textContent = 'Starting demo signup...';
  statusBox.className = 'status-box';

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const role = document.getElementById('role').value;
  const board = document.getElementById('board').value;

  // Enhanced validation
  if (!name || name.length < 2) {
    statusBox.textContent = 'Please enter your full name (at least 2 characters).';
    statusBox.className = 'status-box error';
    document.getElementById('name').focus();
    return;
  }

  if (!phone || !/^\+?[\d\s\-\(\)]{10,}$/.test(phone.replace(/\s/g, ''))) {
    statusBox.textContent = 'Please enter a valid phone number (at least 10 digits).';
    statusBox.className = 'status-box error';
    document.getElementById('phone').focus();
    return;
  }

  if (!role) {
    statusBox.textContent = 'Please select your role.';
    statusBox.className = 'status-box error';
    document.getElementById('role').focus();
    return;
  }

  if (!board) {
    statusBox.textContent = 'Please select your board.';
    statusBox.className = 'status-box error';
    document.getElementById('board').focus();
    return;
  }

  try {
    const response = await fetch('/api/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, role, board })
    });

    const result = await response.json();
    if (!response.ok) {
      statusBox.textContent = result.error || 'Demo signup failed. Please try again.';
      statusBox.className = 'status-box error';
      return;
    }

    statusBox.textContent = 'Demo signup successful. Redirecting...';
    statusBox.className = 'status-box success';

    // Add small delay for better UX on mobile
    setTimeout(() => {
      window.location.href = `dashboard.html?role=${encodeURIComponent(role)}&board=${encodeURIComponent(board)}`;
    }, 1000);

  } catch (error) {
    statusBox.textContent = 'Unable to connect to the demo signup service. Please check your internet connection.';
    statusBox.className = 'status-box error';
  }
});

// Add input validation feedback
const inputs = form.querySelectorAll('input, select');
inputs.forEach(input => {
  input.addEventListener('blur', () => {
    if (input.value.trim()) {
      input.classList.add('has-value');
    } else {
      input.classList.remove('has-value');
    }
  });

  input.addEventListener('input', () => {
    if (statusBox.classList.contains('error')) {
      statusBox.textContent = '';
      statusBox.className = 'status-box';
    }
  });
});

// Handle form reset
form.addEventListener('reset', () => {
  statusBox.textContent = '';
  statusBox.className = 'status-box';
  inputs.forEach(input => input.classList.remove('has-value'));
});
