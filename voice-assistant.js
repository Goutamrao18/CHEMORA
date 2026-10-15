// CHEMORA Voice Assistant Bridge
(function () {
  // Voice input bridge
  window.CHEMORA_VOICE_ENABLED = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
})();
