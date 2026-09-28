function isGroup(jid) {
  return jid.endsWith('@g.us');
}

function isSkippableMedia(messageContent) {
  if (!messageContent) return true;

  const skippableTypes = [
    'imageMessage',
    'videoMessage',
    'stickerMessage',
    'documentMessage',
    'audioMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
  ];

  return skippableTypes.some((type) => messageContent[type]);
}

function extractText(messageContent) {
  if (!messageContent) return '';
  return (
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    ''
  );
}

function containsSensitiveWord(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

module.exports = { isGroup, isSkippableMedia, extractText, containsSensitiveWord };