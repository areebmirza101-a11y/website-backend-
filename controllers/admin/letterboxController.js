const createError = require('http-errors');
const { store } = require('../../utils/data_store');
const supabase = require('../../config/supabase');
const { sendNoreplyMail } = require('../../utils/mailer');

/**
 * GET /api/admin/letterbox/recipients
 * Extracts all unique customers who made purchases on the site from the orders table
 */
exports.getRecipients = async (req, res) => {
  const allOrders = await store.orders.findAll();

  const customerMap = {};

  allOrders.forEach((order) => {
    const rawEmail = order.customer_email;
    if (!rawEmail || typeof rawEmail !== 'string') return;
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;

    const orderTotal = parseFloat(order.total) || 0;
    const isPaid = order.payment_status === 'paid';
    const createdAt = order.created_at || new Date().toISOString();

    if (!customerMap[email]) {
      customerMap[email] = {
        email,
        name: order.customer_name || 'Customer',
        orderCount: 1,
        paidOrdersCount: isPaid ? 1 : 0,
        totalSpent: orderTotal,
        lastOrderAt: createdAt,
        lastOrderId: order.id,
      };
    } else {
      customerMap[email].orderCount += 1;
      if (isPaid) customerMap[email].paidOrdersCount += 1;
      customerMap[email].totalSpent += orderTotal;
      if (new Date(createdAt) > new Date(customerMap[email].lastOrderAt)) {
        customerMap[email].lastOrderAt = createdAt;
        customerMap[email].lastOrderId = order.id;
        if (order.customer_name) customerMap[email].name = order.customer_name;
      }
    }
  });


  // Include Newsletter Subscribers into Letterbox Audience
  try {
    const { data: subscribers } = await supabase
      .from('contact_messages')
      .select('email, name, created_at')
      .eq('subject', 'Newsletter Subscription');

    (subscribers || []).forEach((sub) => {
      const email = (sub.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) return;
      if (!customerMap[email]) {
        customerMap[email] = {
          email,
          name: sub.name || 'VIP Subscriber',
          orderCount: 0,
          paidOrdersCount: 0,
          totalSpent: 0,
          lastOrderAt: sub.created_at || new Date().toISOString(),
          lastOrderId: null,
          isSubscriber: true,
        };
      } else {
        customerMap[email].isSubscriber = true;
      }
    });
  } catch (err) {
    console.error('[Letterbox Subscribers Sync Error]:', err.message);
  }

  const recipients = Object.values(customerMap).map((c) => ({
    ...c,
    totalSpent: Math.round(c.totalSpent * 100) / 100,
  })).sort((a, b) => b.totalSpent - a.totalSpent);

  res.json({
    count: recipients.length,
    recipients,
  });
};

/**
 * POST /api/admin/letterbox/send
 * Sends a branded broadcast email from noreply@velmorascreation.com to selected/all purchasing customers
 */
exports.sendBroadcast = async (req, res) => {
  const { subject, message, recipientEmails } = req.body;

  if (!subject || !subject.trim()) {
    throw createError(400, 'Email Subject is required');
  }
  if (!message || !message.trim()) {
    throw createError(400, 'Email Message content is required');
  }

  // Fetch all orders and newsletter subscribers
  const allOrders = await store.orders.findAll();
  const orderEmails = allOrders
    .map((o) => o.customer_email?.trim().toLowerCase())
    .filter((e) => e && e.includes('@'));

  let subscriberEmails = [];
  try {
    const { data: subData } = await supabase
      .from('contact_messages')
      .select('email')
      .eq('subject', 'Newsletter Subscription');
    subscriberEmails = (subData || [])
      .map((s) => s.email?.trim().toLowerCase())
      .filter((e) => e && e.includes('@'));
  } catch (e) {}

  const allCustomerEmails = [...new Set([...orderEmails, ...subscriberEmails])];

  let targetEmails = [];
  if (!recipientEmails || recipientEmails === 'all' || (Array.isArray(recipientEmails) && recipientEmails.length === 0)) {
    targetEmails = allCustomerEmails;
  } else if (Array.isArray(recipientEmails)) {
    targetEmails = recipientEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
  } else if (typeof recipientEmails === 'string') {
    targetEmails = [recipientEmails.trim().toLowerCase()];
  }

  if (targetEmails.length === 0) {
    throw createError(400, 'No recipients selected or found in customer list');
  }

  const currentYear = new Date().getFullYear();
  const formattedBody = message
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.7;">${line}</p>`)
    .join('');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);">
          
          <!-- Luxury Dark Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #141414 0%, #1e293b 100%); padding: 36px 32px; text-align: center; border-bottom: 3px solid #d4af37;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                VELMORAS CREATION
              </h1>
              <p style="margin: 6px 0 0; color: #d4af37; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                Handcrafted Cinema & Cosplay Outfits
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                ${subject}
              </h2>
              
              <div style="margin-bottom: 32px;">
                ${formattedBody}
              </div>

              <!-- Store CTA Button -->
              <div style="text-align: center; margin: 32px 0 24px;">
                <a href="https://velmorascreation.com/products" target="_blank" style="display: inline-block; background-color: #233b6e; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 800; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(35, 59, 110, 0.25);">
                  Visit Velmoras Store →
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0 20px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                You are receiving this update because you placed an order at Velmoras Creation.<br>
                For questions or inquiries, reply directly to this email or contact <a href="mailto:info@velmorascreation.com" style="color: #233b6e; font-weight: 700; text-decoration: none;">info@velmorascreation.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 22px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © ${currentYear} Velmoras Creation. All rights reserved. • <a href="https://velmorascreation.com" style="color: #64748b; text-decoration: underline;">velmorascreation.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  let sentCount = 0;
  let failedCount = 0;
  const sentList = [];

  for (const email of targetEmails) {
    try {
      const ok = await sendNoreplyMail({
        to: email,
        subject,
        html: emailHtml,
        text: message,
        replyTo: process.env.CONTACT_EMAIL || 'info@velmorascreation.com',
      });
      if (ok) {
        sentCount++;
        sentList.push(email);
      } else {
        failedCount++;
      }
    } catch (err) {
      console.error(`[Letterbox] Failed to send email to ${email}:`, err.message);
      failedCount++;
    }
  }

  res.json({
    success: true,
    message: `Broadcast completed. ${sentCount} sent, ${failedCount} failed.`,
    sentCount,
    failedCount,
    sentTo: sentList,
  });
};

