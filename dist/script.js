const form = document.querySelector('#registration-form');
const dialog = document.querySelector('#ticket-dialog');
const closeTicket = document.querySelector('#close-ticket');
const nameInput = document.querySelector('#name');
const instagramInput = document.querySelector('#instagram');
const submitButton = form.querySelector('button[type="submit"]');
const submitLabel = submitButton.querySelector('span');
const formStatus = document.querySelector('#form-status');
const accessGate = document.querySelector('#access-gate');
const enterSite = document.querySelector('#enter-site');
const ambientAudio = document.querySelector('#ambient-audio');
const soundToggle = document.querySelector('#sound-toggle');

ambientAudio.volume = 0.72;

function updateSoundToggle(isPlaying) {
  soundToggle.textContent = isPlaying ? 'SONIDO ON' : 'SONIDO OFF';
  soundToggle.setAttribute('aria-pressed', String(isPlaying));
  soundToggle.setAttribute('aria-label', isPlaying ? 'Silenciar música' : 'Activar música');
}

enterSite.addEventListener('click', async () => {
  enterSite.disabled = true;
  accessGate.classList.add('is-leaving');
  document.body.classList.remove('is-gated');
  soundToggle.hidden = false;

  try {
    await ambientAudio.play();
    updateSoundToggle(true);
  } catch (error) {
    updateSoundToggle(false);
  }

  window.setTimeout(() => {
    accessGate.hidden = true;
  }, 520);
});

soundToggle.addEventListener('click', async () => {
  if (ambientAudio.paused) {
    try {
      await ambientAudio.play();
      updateSoundToggle(true);
    } catch (error) {
      updateSoundToggle(false);
    }
    return;
  }

  ambientAudio.pause();
  updateSoundToggle(false);
});

function cleanInstagram(value) {
  return value.trim().replace(/^@+/, '');
}

function setError(input, message) {
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  const error = document.querySelector(`#${input.id}-error`);
  error.textContent = message;
}

function createCode(name, instagram) {
  const source = `${name}|${instagram}|${Date.now()}`;
  let hash = 0;
  for (const character of source) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const instagram = cleanInstagram(instagramInput.value);
  const instagramIsValid = /^[A-Za-z0-9._]{1,30}$/.test(instagram);

  setError(nameInput, name.length >= 2 ? '' : 'Escribe tu nombre.');
  setError(instagramInput, instagramIsValid ? '' : 'Escribe un usuario de Instagram válido.');

  if (name.length < 2) {
    nameInput.focus();
    return;
  }

  if (!instagramIsValid) {
    instagramInput.focus();
    return;
  }

  instagramInput.value = instagram;
  submitButton.disabled = true;
  submitLabel.textContent = 'REGISTRANDO...';
  formStatus.textContent = '';
  formStatus.classList.remove('is-error');

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error('Formspree rechazó el registro.');

    const code = createCode(name, instagram);
    document.querySelector('[data-ticket-name]').textContent = name;
    document.querySelector('[data-ticket-instagram]').textContent = `@${instagram}`;
    document.querySelector('[data-ticket-id]').textContent = code;
    document.querySelector('[data-ticket-code]').textContent = `PX-${code}`;
    formStatus.textContent = 'REGISTRO CONFIRMADO.';
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  } catch (error) {
    formStatus.textContent = 'NO SE PUDO COMPLETAR EL REGISTRO. INTENTA DE NUEVO.';
    formStatus.classList.add('is-error');
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = 'GENERAR BOLETO';
  }
});

closeTicket.addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
});

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
