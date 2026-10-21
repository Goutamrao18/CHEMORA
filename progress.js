// CHEMORA Learner Progress Script
(function () {
  function updateDashboard() {
    let challengeState = {};
    let expProgress = [];
    let streakState = {};

    try {
      challengeState = JSON.parse(localStorage.getItem('chemoraChallengeState') || '{}');
    } catch {}

    try {
      expProgress = JSON.parse(localStorage.getItem('chemoraExperimentProgress') || '[]');
      if (!Array.isArray(expProgress)) expProgress = [];
    } catch {}

    try {
      streakState = JSON.parse(localStorage.getItem('chemoraDailyStreak') || '{}');
    } catch {}

    const levels = Array.isArray(challengeState.levels)
      ? challengeState.levels.filter(n => Number.isInteger(n) && n >= 1 && n <= 100)
      : [];
    const completedCount = levels.length;
    const answers = Math.max(0, Number(challengeState.answers) || 0);
    const correct = Math.max(0, Number(challengeState.correct) || 0);
    const accuracy = answers > 0 ? Math.round((correct / answers) * 100) : 0;
    const streak = Math.max(0, Number(streakState.currentStreak) || 0);

    const elCompleted = document.getElementById('statCompleted');
    if (elCompleted) elCompleted.textContent = `${completedCount} / 100`;

    const elBarCompleted = document.getElementById('barCompleted');
    if (elBarCompleted) elBarCompleted.style.width = `${completedCount}%`;

    const elAccuracy = document.getElementById('statAccuracy');
    if (elAccuracy) elAccuracy.textContent = `${accuracy}%`;

    const elBarAccuracy = document.getElementById('barAccuracy');
    if (elBarAccuracy) elBarAccuracy.style.width = `${accuracy}%`;

    const elExp = document.getElementById('statExperiments');
    if (elExp) elExp.textContent = `${expProgress.length} / 20`;

    const elBarExp = document.getElementById('barExperiments');
    if (elBarExp) elBarExp.style.width = `${Math.round((expProgress.length / 20) * 100)}%`;

    const elStreak = document.getElementById('statStreak');
    if (elStreak) elStreak.textContent = `${streak} Days`;

    const elBarStreak = document.getElementById('barStreak');
    if (elBarStreak) elBarStreak.style.width = `${Math.min(100, streak * 10)}%`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDashboard);
  } else {
    updateDashboard();
  }
})();
