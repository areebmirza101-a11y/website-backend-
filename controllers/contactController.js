const { store } = require('../utils/data_store');
const { lookupCountry, clientIp } = require('../utils/geo');
const { sendInfoMail, sendMail } = require('../utils/mailer');
const { sendWhatsAppAlert } = require('../utils/whatsapp');

exports.create = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    throw require('http-errors')(400, 'Name, email, subject and message are required');
  }

  const geo = lookupCountry(clientIp(req));

  const record = await store.contact_messages.create({
    name,
    email,
    subject,
    message,
    read: false,
    country: geo ? geo.code : null,
  });

  // Send Email Notification to Admin
  await sendMail({
    to: process.env.CONTACT_EMAIL || 'info@velmorascreation.com', // Admin inbox
    subject: `New Contact Inquiry: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Country:</strong> ${geo ? geo.code : 'Unknown'}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  });

  // Send Auto-Reply to Customer
  await sendInfoMail({
    to: email, // Customer email
    subject: `We received your inquiry - Velmoras Creation`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${name},</h2>
        <p>Thank you for reaching out to <strong>Velmoras Creation</strong>.</p>
        <p>We have successfully received your inquiry regarding <strong>"${subject}"</strong>. Our team will review your message and get back to you as soon as possible.</p>
        <br />
        <p>Best Regards,</p>
        <p><strong>The Velmoras Creation Team</strong></p>
        <p><a href="https://velmorascreation.com">www.velmorascreation.com</a></p>
      </div>
    `,
  });

  // Send WhatsApp Notification to Admin
  const whatsappMsg = `🔔 *New Customer Inquiry — Velmoras Creation*

👤 *Name:* ${name}
📧 *Email:* ${email}
🌍 *Country:* ${geo ? geo.code : 'Unknown'}
📌 *Subject:* ${subject}
💬 *Message:*
"${message}"

⏰ *Received:* ${new Date().toLocaleString()}`;

  sendWhatsAppAlert(whatsappMsg).catch((err) => {
    console.error('[WhatsApp] Contact alert error:', err.message);
  });

  res.status(201).json({ message: 'Message sent successfully', id: record.id });
};

exports.list = async (req, res) => {
  const messages = await store.contact_messages.findAll();
  res.json(messages);
};

exports.markRead = async (req, res) => {
  const message = await store.contact_messages.findById(req.params.id);
  if (!message) throw require('http-errors')(404, 'Message not found');

  const read = req.body && typeof req.body.read === 'boolean' ? req.body.read : true;
  const updated = await store.contact_messages.update(message.id, { read });
  res.json(updated);
};

exports.remove = async (req, res) => {
  const message = await store.contact_messages.findById(req.params.id);
  if (!message) throw require('http-errors')(404, 'Message not found');

  await store.contact_messages.delete(message.id);
  res.json({ message: 'Message deleted successfully' });
};

exports.unreadCount = async (req, res) => {
  const count = await store.contact_messages.countUnread();
  res.json({ count });
};

exports.reply = async (req, res) => {
  const { id } = req.params;
  const { message, subject } = req.body;
  if (!message || !message.trim()) {
    throw require('http-errors')(400, 'Reply message cannot be empty');
  }

  const contactMessage = await store.contact_messages.findById(id);
  if (!contactMessage) throw require('http-errors')(404, 'Message not found');

  const replySubject = subject || `Re: ${contactMessage.subject || 'Your Inquiry'}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: #0f172a; padding: 24px 32px; text-align: left;">
        <span style="font-size: 20px; font-weight: bold; letter-spacing: 0.15em; color: #ffffff;">VELMORAS CREATION</span>
        <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Customer Support & Inquiries</p>
      </div>
      <div style="padding: 32px; color: #1e293b;">
        <p style="font-size: 15px; margin-top: 0;">Dear <strong>${contactMessage.name}</strong>,</p>
        <div style="font-size: 14px; line-height: 1.7; color: #334155; margin: 20px 0; white-space: pre-wrap;">${message}</div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
        <div style="background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #64748b;">
          <p style="margin: 0 0 4px; font-weight: 600; color: #475569;">In reference to your message:</p>
          <p style="margin: 0; white-space: pre-wrap; font-style: italic;">"${contactMessage.message}"</p>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 28px; line-height: 1.5;">
          Warm regards,<br />
          <strong style="color: #0f172a;">The Velmoras Creation Team</strong><br />
          <a href="https://velmorascreation.com" style="color: #BA9B74; text-decoration: none;">www.velmorascreation.com</a>
        </p>
      </div>
    </div>
  `;

  await sendInfoMail({
    to: contactMessage.email,
    subject: replySubject,
    html,
    text: message,
  });

  if (!contactMessage.read) {
    await store.contact_messages.update(contactMessage.id, { read: true });
  }

  res.json({ message: 'Reply sent successfully to customer' });
};
