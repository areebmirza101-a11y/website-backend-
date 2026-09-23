const { store } = require('../utils/data_store');
const { lookupCountry, clientIp } = require('../utils/geo');

exports.track = async (req, res) => {
  const { path, visitor_id, session_id, referrer } = req.body;

  if (!path) return res.status(400).json({ error: 'path required' });

  const ip = clientIp(req);
  const geo = lookupCountry(ip);

  await store.page_views.create({
    path,
    visitor_id: visitor_id || null,
    session_id: session_id || null,
    referrer: referrer || null,
    user_agent: req.headers['user-agent'] || null,
    ip: ip || null,
    country: geo ? geo.code : null,
  });

  res.json({ success: true });
};
