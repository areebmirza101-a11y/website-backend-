const supabase = require('../config/supabase');
const createError = require('http-errors');
const { sendNoreplyMail, generateWelcomeEmailHtml } = require('../utils/mailer');

exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw createError(400, 'A valid email address is required.');
    }

    const normalized = email.trim().toLowerCase();

    // Check if already subscribed in contact_messages
    const { data: existing, error: checkErr } = await supabase
      .from('contact_messages')
      .select('id, email')
      .eq('email', normalized)
      .eq('subject', 'Newsletter Subscription')
      .maybeSingle();

    if (existing) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: 'You are already a valued VIP member! Your exclusive welcome gift code is WELCOME10.',
        code: 'WELCOME10',
      });
    }

    // Insert new subscription
    const { error: insertErr } = await supabase.from('contact_messages').insert({
      name: 'VIP Newsletter Subscriber',
      email: normalized,
      subject: 'Newsletter Subscription',
      message: 'Subscribed to VIP Newsletter & claimed WELCOME10 discount code.',
      read: true,
    });

    if (insertErr) {
      console.error('[Newsletter DB Error]:', insertErr);
    }

    const clientUrl = (process.env.CLIENT_URL || 'https://velmorascreation.com').replace(/\/+$/, '');

    // Send Luxury Automated Welcome Email
    sendNoreplyMail({
      to: normalized,
      subject: 'Welcome to the Velmoras Creation VIP Club — Here is your 10% Gift',
      html: generateWelcomeEmailHtml({
        email: normalized,
        discountCode: 'WELCOME10',
        clientUrl,
      }),
    }).catch((err) => {
      console.error('[Newsletter Mail Error]:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Welcome to Velmoras VIP Club! Check your inbox for your 10% discount code.',
      code: 'WELCOME10',
    });
  } catch (err) {
    next(err);
  }
};

exports.listSubscribers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('subject', 'Newsletter Subscription')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

