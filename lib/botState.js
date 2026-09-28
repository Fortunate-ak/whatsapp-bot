const fs = require('fs');
const STATE_FILE = './botState.json';

function isEnabled() {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return data.enabled !== false;
  } catch {
    return true;
  }
}

function setEnabled(value) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ enabled: value }));
}

module.exports = { isEnabled, setEnabled };