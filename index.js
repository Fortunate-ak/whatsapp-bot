require ('dotenv').config();
const {default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const {isGroup, isSkippableMedia,extractText, containsSensitiveWord } = require('.lib/filters');
const {isEnabled, setEnabled} =require('.lib/botState');
const {getReply} = require('./lib/llm');
const sensitiveKeyWords = require('./config/sensitiveKeywordsKeywords.json');

const lastReplyTime = {};
const COOLDOWN_MS = 15 * 1000;

async function startBot() {
    const {state,saceCreds} = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        logger: pino({level: 'silent' }),
    });

    sock.ev.on('creds.update' , saveCreds);

    sock.ev.on('connection.update' , (update) => {
        const {connection, lastDisconnect } = update;
    if (connection === 'close') {
        const shouldReconnect =
           lastDisconnect?.error?.output.statusCode !== DisconnectReason.loggedOut;
        console.log('Connectionclosed, reconnecting:' , shouldReconnect);
        if (shouldReconnect) startBot();
    } else if (connection === 'open') {
        console.log('Connected to Whatsapp. Bot is', isEnabled() ? 'ON' : 'OFF');
    }
    });

    sock.ev.on('message.upsert', async ({messages}) => {
        const msg = messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;
        const text = extractText(msg.message);
        const selfJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';


    if (msg.key.fromMe && sender === selfJid) {
      const command = text.trim().toLowerCase();
      if (command === '/bot off') {
        setEnabled(false);
        await sock.sendMessage(sender, { text: '🔴 Auto-reply turned OFF. Replying manually now.' });
      } else if (command === '/bot on') {
        setEnabled(true);
        await sock.sendMessage(sender, { text: '🟢 Auto-reply turned ON.' });
      }
      return;
    }

    if (msg.key.fromMe) return;
    if (!isEnabled()) return;
    if (isGroup(sender)) return;
    if (isSkippableMedia(msg.message)) return;
    if (!text) return;

    if (containsSensitiveWord(text, sensitiveKeywords)) {
      await sock.sendMessage(selfJid, {
        text: `⚠️ Sensitive message from ${sender} — reply to this one yourself:\n"${text}"`,
      });
      return;
    }

    const now = Date.now();
    if (lastReplyTime[sender] && now - lastReplyTime[sender] < COOLDOWN_MS) {
      return;
    }
    lastReplyTime[sender] = now;

    try {
      const reply = await getReply(text);
      await sock.sendMessage(sender, { text: reply });
    } catch (err) {
      console.error('Error generating/sending reply:', err.message);
    }
  });
}

startBot();
    
    
