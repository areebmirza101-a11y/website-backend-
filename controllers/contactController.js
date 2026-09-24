const { store } = require('../utils/data_store');
const { lookupCountry, clientIp } = require('../utils/geo');
const { sendMail } = require('../utils/mailer');

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
    to: process.env.SMTP_USER || 'info@velmorascreation.com', // Admin email
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

  res.status(201).json({ message: 'Message sent successfully', id: record.id });
};

exports.list = async (req, res) => {
  const messages = await store.contact_messages.findAll();
  res.json(messages);
};

exports.markRead = async (req, res) => {
  const message = await store.contact_messages.findById(req.params.id);
  if (!message) throw require('http-errors')(404, 'Message not found');

  const updated = await store.contact_messages.update(message.id, { read: true });
  res.json(updated);
};

exports.unreadCount = async (req, res) => {
  const count = await store.contact_messages.countUnread();
  res.json({ count });
};
