/* CHEMORA AI text assistant — secure server-side AI */
(() => {
  const root = document.body;
  if (!root || document.querySelector('.chemora-assistant-launcher')) return;

  const state = { busy: false };

  const launcher = document.createElement('button');
  launcher.className = 'chemora-assistant-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Open CHEMORA AI assistant');
  launcher.textContent = '✦';

  const panel = document.createElement('section');
  panel.className = 'chemora-assistant-panel';
  panel.setAttribute('aria-label', 'CHEMORA AI assistant');

  panel.innerHTML = `
    <div class="chemora-assistant-head">
      <div class="chemora-assistant-title">
        <span class="chemora-assistant-orb">✦</span>
        <div><strong>CHEMORA AI</strong><small>Text chemistry tutor</small></div>
      </div>
      <button class="chemora-assistant-close" aria-label="Close">×</button>
    </div>
    <div class="chemora-assistant-messages"></div>
    <div class="chemora-assistant-status"></div>
    <div class="chemora-assistant-controls">
      <input class="chemora-assistant-input" placeholder="Ask a chemistry question…" autocomplete="off">
      <button class="chemora-assistant-btn send" title="Send" aria-label="Send">➤</button>
    </div>
  `;

  root.append(launcher, panel);

  const messages = panel.querySelector('.chemora-assistant-messages');
  const input = panel.querySelector('.chemora-assistant-input');
  const send = panel.querySelector('.send');
  const status = panel.querySelector('.chemora-assistant-status');

  const add = (text, who = 'ai') => {
    const d = document.createElement('div');
    d.className = `chemora-msg ${who}`;
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  };

  const context = () => {
    const title = document.title || 'CHEMORA';
    const heading = document.querySelector('h1,h2')?.textContent?.trim() || '';
    return `${title}. Current visible heading: ${heading}.`;
  };

  const ask = async (text) => {
    text = String(text || '').trim();
    if (!text || state.busy) return;

    state.busy = true;
    add(text, 'user');
    input.value = '';
    status.textContent = 'Thinking…';

    try {
      const r = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, context: context() })
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Assistant unavailable');

      add(data.answer || 'I could not generate an answer.');
    } catch (e) {
      add('I could not reach the AI assistant right now. Check your Vercel AI configuration and try again.');
    } finally {
      state.busy = false;
      status.textContent = '';
    }
  };

  launcher.onclick = () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !messages.children.length) {
      add('Hi! I’m CHEMORA AI. Ask me about chemistry, reactions, experiments, lab safety, or how to use this site.');
      input.focus();
    }
  };

  panel.querySelector('.chemora-assistant-close').onclick = () => {
    panel.classList.remove('open');
  };

  send.onclick = () => ask(input.value);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') ask(input.value);
  });

  // Keep the existing public API name for compatibility, but expose text chat only.
  window.ChemoraVoice = {
    ask,
    open: () => panel.classList.add('open')
  };
})();
