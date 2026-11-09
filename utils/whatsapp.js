/**
 * WhatsApp Notification Service via CallMeBot API
 * Sends instant alert messages to the admin's WhatsApp number.
 */

const { store } = require('./data_store');

const getAdminPhone = async () => {
  let phone = process.env.WHATSAPP_ADMIN_PHONE;
  if (!phone) {
    try {
      const s = await store.settings.findFirst();
      phone = s?.whatsapp || '';
    } catch {}
  }
  phone = (phone || '').replace(/[\s\-\(\)]/g, '');
  if (phone && !phone.startsWith('+')) {
    phone = '+' + phone;
  }
  return phone;
};

const getApiKey = () => {
  return process.env.CALLMEBOT_API_KEY || '';
};

/**
 * Send WhatsApp text message to admin
 * @param {string} messageText 
 * @returns {Promise<boolean>}
 */
const sendWhatsAppAlert = async (messageText) => {
  const phone = await getAdminPhone();
  const apiKey = getApiKey();

  if (!phone || !apiKey) {
    console.log('[WhatsApp Alert] Skipped: WHATSAPP_ADMIN_PHONE or CALLMEBOT_API_KEY not configured.');
    return false;
  }

  try {
    const encodedText = encodeURIComponent(messageText);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodedText}&apikey=${apiKey}`;

    const res = await fetch(url);
    const responseText = await res.text();

    if (res.ok && (responseText.includes('Success') || responseText.includes('Message queued') || responseText.includes('Message Sent'))) {
      console.log(`[WhatsApp Alert] Sent successfully to ${phone}`);
      return true;
    } else {
      console.warn(`[WhatsApp Alert] API returned:`, responseText);
      return false;
    }
  } catch (error) {
    console.error('[WhatsApp Alert] Error:', error.message);
    return false;
  }
};

module.exports = {
  sendWhatsAppAlert,
  getAdminPhone,
  getApiKey,
};
