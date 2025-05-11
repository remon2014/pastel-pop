const LEADERBOARD_KEY = 'pastelPopLeaderboard';

export function getLeaderboard() {
  return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
}

export function saveLeaderboard(entries) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function isTop5(score) {
  const leaderboard = getLeaderboard();
  return leaderboard.length < 5 || score > leaderboard[leaderboard.length - 1].score;
}

export function maybeSaveHighScore(score) {
  if (!isTop5(score)) return;

  const name = prompt("🎉 New High Score! Enter your name:");
  if (!name) return;

  const leaderboard = getLeaderboard();
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score); // Descending order
  saveLeaderboard(leaderboard.slice(0, 5));

  renderLeaderboard();
}

export function renderLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) {
    console.warn('⚠️ leaderboardList not found');
    return;
  }
  console.log('✅ leaderboardList found:', list);

  const leaderboard = getLeaderboard();
  list.innerHTML = '';
  leaderboard.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.name} — ${entry.score}`;
    list.appendChild(li);
  });
}
