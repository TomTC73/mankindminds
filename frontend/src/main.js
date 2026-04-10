import './style.css';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const formEl = document.getElementById('submission-form');
const typeEl = document.getElementById('type');
const textGroupEl = document.getElementById('text-group');
const imageGroupEl = document.getElementById('image-group');
const textEl = document.getElementById('text');
const imageEl = document.getElementById('image');
const statusEl = document.getElementById('status');

function toggleFields() {
  const type = typeEl.value;
  const isText = type === 'text';

  textGroupEl.classList.toggle('hidden', !isText);
  imageGroupEl.classList.toggle('hidden', isText);

  textEl.required = isText;
  imageEl.required = !isText;
}

async function submitForm(event) {
  event.preventDefault();

  const captchaToken = window.grecaptcha?.getResponse?.() || '';
  if (!captchaToken) {
    statusEl.textContent = 'Please complete the captcha.';
    return;
  }

  const formData = new FormData();
  const type = typeEl.value;
  formData.append('type', type);
  formData.append('captchaToken', captchaToken);

  if (type === 'text') {
    formData.append('text', textEl.value);
  } else if (imageEl.files && imageEl.files[0]) {
    formData.append('image', imageEl.files[0]);
  }

  statusEl.textContent = 'Submitting...';

  try {
    const response = await fetch(`${apiBaseUrl}/api/submissions`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    statusEl.textContent = data.message || 'Submission completed.';

    if (response.ok) {
      formEl.reset();
      toggleFields();
      window.grecaptcha?.reset?.();
    }
  } catch (error) {
    statusEl.textContent = 'Could not reach backend. Is Spring Boot running on port 8080?';
    window.grecaptcha?.reset?.();
  }
}

typeEl.addEventListener('change', toggleFields);
formEl.addEventListener('submit', submitForm);
toggleFields();
