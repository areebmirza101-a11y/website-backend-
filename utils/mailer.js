const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 465;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Velmoras Creation';

const NOREPLY_USER = process.env.SMTP_USER || 'noreply@velmorascreation.com';
const NOREPLY_PASS = process.env.SMTP_PASS || '?KH:#B6Nb';

const INFO_USER = process.env.CONTACT_EMAIL || 'info@velmorascreation.com';
const INFO_PASS = process.env.CONTACT_EMAIL_PASS || process.env.SMTP_PASS || '?KH:#B6Nb';

// Transporter for automated / transactional emails (noreply)
const createNoreplyTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: NOREPLY_USER,
      pass: NOREPLY_PASS,
    },
  });
};

// Transporter for customer support / direct inquiries (info)
const createInfoTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: INFO_USER,
      pass: INFO_PASS,
    },
  });
};

/**
 * Send automated email from noreply@velmorascreation.com
 * Sets replyTo: info@velmorascreation.com by default so customer replies route to support.
 */
const sendNoreplyMail = async ({ to, subject, html, text, replyTo = INFO_USER }) => {
  if (!NOREPLY_USER || !NOREPLY_PASS) {
    console.log('[Mailer] Noreply SMTP not configured. Skipping email send.', { to, subject });
    return false;
  }

  const transporter = createNoreplyTransporter();
  const mailOptions = {
    from: `"${SMTP_FROM_NAME}" <${NOREPLY_USER}>`,
    to,
    replyTo,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Noreply Email sent: %s to %s', info.messageId, to);
    return true;
  } catch (error) {
    console.error('[Mailer] Error sending noreply email:', error.message);
    return false;
  }
};

/**
 * Send inquiry / support email from info@velmorascreation.com
 */
const sendInfoMail = async ({ to, subject, html, text, replyTo = INFO_USER }) => {
  if (!INFO_USER || !INFO_PASS) {
    console.log('[Mailer] Info SMTP not configured. Skipping email send.', { to, subject });
    return false;
  }

  const transporter = createInfoTransporter();
  const mailOptions = {
    from: `"${SMTP_FROM_NAME}" <${INFO_USER}>`,
    to,
    replyTo,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Info Email sent: %s to %s', info.messageId, to);
    return true;
  } catch (error) {
    console.error('[Mailer] Error sending info email:', error.message);
    return false;
  }
};

/**
 * Luxury Branded HTML Email Template for Order Confirmation with Live Tracking
 */
const generateOrderEmailHtml = ({
  orderId,
  customerName,
  customerEmail,
  shippingAddress,
  items = [],
  total,
  currency = 'USD',
  trackingUrl,
  isPaid = false,
  paymentMethod = 'PayPal',
  captureId = null,
}) => {
  const currentYear = new Date().getFullYear();
  const formattedTotal = parseFloat(total || 0).toFixed(2);

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b;">
          <strong style="color: #0f172a; font-size: 14px; display: block;">${item.name || item.product_name || `Product #${item.productId || item.product_id}`}</strong>
          <span style="font-size: 12px; color: #64748b; margin-top: 3px; display: inline-block;">
            ${item.size ? `Size: <strong>${item.size}</strong> &nbsp;|&nbsp; ` : ''}
            ${item.color ? `Color: <strong>${item.color}</strong> &nbsp;|&nbsp; ` : ''}
            Qty: <strong>${item.qty || item.quantity || 1}</strong>
          </span>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; font-size: 14px; color: #0f172a; vertical-align: top;">
          $${parseFloat((item.finalPrice || item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Confirmation - Velmoras Creation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #141414 0%, #1e293b 100%); padding: 36px 32px; text-align: center; border-bottom: 3px solid #d4af37;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2.5px; text-transform: uppercase;">
                VELMORAS CREATION
              </h1>
              <p style="margin: 6px 0 0; color: #d4af37; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                Handcrafted Cinema & Cosplay Outfits
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              
              <!-- Order Status Badge -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                  ORDER CONFIRMED & RECEIVED
                </span>
              </div>

              <!-- Greeting & Reference -->
              <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; letter-spacing: -0.5px;">
                Thank You, ${customerName}!
              </h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; text-align: center; line-height: 1.6;">
                We have successfully received your order <strong>#${orderId}</strong>. Our master craftsmen are now preparing and tailoring your piece with absolute attention to detail.
              </p>

              <!-- Live Tracking CTA Button -->
              <div style="text-align: center; margin: 28px 0 32px;">
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #233b6e; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 14px; font-weight: 800; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 6px 18px rgba(35, 59, 110, 0.28);">
                  Track Your Order Online →
                </a>
                <p style="margin: 10px 0 0; font-size: 11px; color: #94a3b8;">
                  Click above anytime to monitor your order progress live.
                </p>
              </div>

              <!-- Order Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                      Order Details (Ref #${orderId})
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                      <tr>
                        <td style="padding-top: 14px; font-size: 13px; color: #64748b;">Shipping:</td>
                        <td style="padding-top: 14px; text-align: right; font-size: 13px; color: #047857; font-weight: 700;">Free Express Worldwide</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px; font-size: 13px; color: #64748b;">Payment Status:</td>
                        <td style="padding-top: 8px; text-align: right; font-size: 13px; color: #0f172a; font-weight: 700; text-transform: uppercase;">
                          ${isPaid ? 'PAID' : 'PENDING'}
                        </td>
                      </tr>
                      ${captureId ? `
                      <tr>
                        <td style="padding-top: 8px; font-size: 11px; color: #94a3b8;">PayPal Capture ID:</td>
                        <td style="padding-top: 8px; text-align: right; font-size: 11px; color: #64748b; font-family: monospace;">${captureId}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding-top: 14px; font-size: 16px; font-weight: 900; color: #0f172a; border-top: 1px solid #e2e8f0; margin-top: 8px;">
                          Total:
                        </td>
                        <td style="padding-top: 14px; text-align: right; font-size: 20px; font-weight: 900; color: #0f172a; border-top: 1px solid #e2e8f0;">
                          $${formattedTotal} ${currency}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Shipping Info Box -->
              ${shippingAddress ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h4 style="margin: 0 0 6px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                      Delivery Address
                    </h4>
                    <p style="margin: 0; font-size: 13px; color: #1e293b; font-weight: 600;">
                      ${customerName}<br>
                      ${shippingAddress}
                    </p>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Customer Support Help -->
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.6;">
                Have questions or need custom measurement adjustments? Simply reply directly to this email or reach our support team at <a href="mailto:info@velmorascreation.com" style="color: #233b6e; font-weight: 700; text-decoration: none;">info@velmorascreation.com</a>.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #475569;">
                Velmoras Creation — Master Crafted Cosplay & Replicas
              </p>
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
};

// Default export wrapper

/**
 * Luxury Welcome Email Template with VIP Promo Code
 */
const generateWelcomeEmailHtml = ({ email, discountCode = 'WELCOME10', clientUrl = 'https://velmorascreation.com' }) => {
  const currentYear = new Date().getFullYear();
  const shopUrl = `${clientUrl.replace(/\/+$/, '')}/products`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Velmoras Creation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #111827; border-radius: 24px; overflow: hidden; border: 1px solid rgba(186, 155, 116, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Luxury Gold Header -->
          <tr>
            <td style="padding: 40px 32px 30px; text-align: center; background: linear-gradient(180deg, #1f2937 0%, #111827 100%); border-bottom: 1px solid rgba(186, 155, 116, 0.2);">
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: #BA9B74;">
                VELMORAS CREATION
              </p>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Welcome to the Inner Circle
              </h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af; letter-spacing: 0.05em;">
                Bespoke Cinema Costumes & Master Replica Tailoring
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #e5e7eb; line-height: 1.7;">
                Thank you for subscribing! You are now part of our private collector circle. You will be the first to receive updates on limited-edition costume drops, rare screen-accurate fabric arrivals, and private tailoring commission windows.
              </p>

              <!-- Luxury Discount Gift Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0; background: linear-gradient(135deg, rgba(186, 155, 116, 0.15) 0%, rgba(186, 155, 116, 0.05) 100%); border: 1px dashed #BA9B74; border-radius: 20px; padding: 24px; text-align: center;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #BA9B74;">
                      YOUR EXCLUSIVE WELCOME GIFT
                    </p>
                    <p style="margin: 0 0 14px; font-size: 26px; font-weight: 900; color: #ffffff;">
                      10% OFF YOUR FIRST ORDER
                    </p>
                    <div style="display: inline-block; background-color: #000000; padding: 10px 24px; border-radius: 12px; border: 1px solid #BA9B74;">
                      <span style="font-family: monospace; font-size: 20px; font-weight: 900; letter-spacing: 0.15em; color: #BA9B74;">
                        ${discountCode}
                      </span>
                    </div>
                    <p style="margin: 14px 0 0; font-size: 12px; color: #9ca3af;">
                      Enter this code at checkout to claim your 10% discount on any custom costume or tailoring order.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 20px;">
                <tr>
                  <td align="center">
                    <a href="${shopUrl}" style="display: inline-block; background: #BA9B74; color: #0b0f19; font-size: 13px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 16px 36px; border-radius: 9999px; box-shadow: 0 10px 25px -5px rgba(186, 155, 116, 0.4);">
                      Explore Costumes & Claim 10%
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Support Line -->
              <p style="margin: 28px 0 0; font-size: 12px; color: #6b7280; text-align: center; line-height: 1.6;">
                Need custom sizing or have questions about a cinema replica? Simply reply to this email or reach us at <a href="mailto:info@velmorascreation.com" style="color: #BA9B74; text-decoration: none; font-weight: bold;">info@velmorascreation.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0f19; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; text-transform: uppercase;">
                Velmoras Creation · Screen-Accurate Tailoring
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5563;">
                © ${currentYear} Velmoras Creation. All rights reserved. • G-10, Islamabad, Pakistan
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
};

module.exports = {
  sendNoreplyMail,
  sendInfoMail,
  sendMail: sendNoreplyMail, // default to noreply with reply-to info
  generateOrderEmailHtml,
  generateWelcomeEmailHtml,
};
