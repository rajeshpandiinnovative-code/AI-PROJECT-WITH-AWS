const statusButton = document.getElementById('checkStatus');
const apiStatus = document.getElementById('apiStatus');

statusButton.addEventListener('click', async () => {
  apiStatus.textContent = 'Checking...';

  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    apiStatus.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    apiStatus.textContent = 'Failed to reach API. Is the backend running?';
  }
});
