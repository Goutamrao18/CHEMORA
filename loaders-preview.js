// loaders-preview.js
(function () {
  var themeToggle = document.getElementById('themeToggle');
  var motionToggle = document.getElementById('motionToggle');
  var beakerSlider = document.getElementById('beakerSlider');
  var beakerValue = document.getElementById('beakerValue');
  var beakerDeterminateLiquid = document.getElementById('beakerDeterminateLiquid');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      document.body.classList.toggle('light');
      var isLight = document.body.classList.contains('light');
      themeToggle.textContent = isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme';
    });
  }

  if (motionToggle) {
    motionToggle.addEventListener('click', function () {
      document.body.classList.toggle('chem-paused');
      var isPaused = document.body.classList.contains('chem-paused');
      motionToggle.textContent = isPaused ? 'Resume Motion' : 'Pause All Loaders';
    });
  }

  if (beakerSlider && beakerDeterminateLiquid && beakerValue) {
    beakerSlider.addEventListener('input', function (e) {
      var val = Number(e.target.value);
      beakerValue.textContent = val + '%';
      var height = (val / 100) * 14;
      var y = 25 - height;
      beakerDeterminateLiquid.setAttribute('y', y.toString());
      beakerDeterminateLiquid.setAttribute('height', height.toString());
    });
  }
})();
