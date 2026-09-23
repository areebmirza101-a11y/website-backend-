const { store } = require('../../utils/data_store');
const { lookupCountry, codeToName } = require('../../utils/geo');

// ---- Date helpers -----------------------------------------------------------

// Local YYYY-MM-DD (avoids the UTC off-by-one that would hide "today" on charts
// for timezones ahead of/behind UTC).
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Build an array of the last `days` calendar days as YYYY-MM-DD strings (oldest → newest)
function lastNDays(days) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(ymd(d));
  }
  return out;
}

const dayKey = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return ymd(d);
};

// Array of YYYY-MM-DD strings covering [start, end] inclusive (oldest → newest).
function daysBetween(start, end) {
  const out = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  // guard against runaway ranges (cap at ~2 years of daily points)
  let guard = 0;
  while (d <= last && guard < 800) {
    out.push(ymd(d));
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return out;
}

// Percentage change of `curr` vs `prev`. null when there's no baseline to compare.
const pctChange = (curr, prev) => {
  if (!prev) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
};

const monthKey = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Last N calendar months as { key: 'YYYY-MM', label: 'Mon' } oldest → newest
function lastNMonths(n) {
  const out = [];
  const base = new Date();
  base.setDate(1);
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
    });
  }
  return out;
}

// ISO week key (year-Www) + short label
function weekInfo(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt - yearStart) / 86400000 + 1) / 7);
  return { key: `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`, week };
}

function lastNWeeks(n) {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i * 7);
    const wi = weekInfo(d);
    out.push({ key: wi.key, label: `W${wi.week}` });
  }
  return out;
}

// ---- Palette for category donut / product bars ------------------------------
const PALETTE = ['#4f46e5', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

// Map a raw country value — an ISO alpha-2 code (traffic/inquiries) OR free-text
// name (order shipping_country) — to a stable { key, name } so the three
// sources merge onto the same country. null for empty values (bucketed as
// "Unknown" by the caller).
function normalizeCountry(raw) {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v) return null;
  if (/^[A-Za-z]{2}$/.test(v)) {
    const code = v.toUpperCase();
    const name = codeToName(code);
    return { key: (name || v).toLowerCase(), name: name || code, code };
  }
  return { key: v.toLowerCase(), name: v, code: null };
}

exports.stats = async (req, res) => {
  // Date range filter: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
  // Defaults to last 30 days if not provided
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const startDate = req.query.start_date ? new Date(req.query.start_date) : defaultStart;
  const endDate = req.query.end_date ? new Date(req.query.end_date) : now;

  // Clamp to valid range
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const productCount = await store.products.count();
  const categoryCount = await store.categories.count();
  const orderCount = await store.orders.count();
  const customerCount = await store.users.count({ role: 'customer' });

  const allOrders = await store.orders.findAll();
  const ordersInRange = allOrders.filter((o) => {
    const t = new Date(o.created_at);
    return t >= startDate && t <= endDate;
  });

  const paidOrders = allOrders.filter((o) => o.payment_status === 'paid');
  const paidInRange = ordersInRange.filter((o) => o.payment_status === 'paid');
  const revenue = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const revenueInRange = paidInRange.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  // ---- Previous comparable period (same length, immediately before start) ----
  const rangeMs = endDate.getTime() - startDate.getTime();
  const prevStart = new Date(startDate.getTime() - rangeMs - 1);
  const prevEnd = new Date(startDate.getTime() - 1);

  // ---- Time series over the selected range (per day) ----
  const days = daysBetween(startDate, endDate);
  const revByDay = Object.fromEntries(days.map((d) => [d, 0]));
  const ordByDay = Object.fromEntries(days.map((d) => [d, 0]));

  for (const o of ordersInRange) {
    const key = dayKey(o.created_at);
    if (key == null || !(key in ordByDay)) continue;
    ordByDay[key] += 1;
    if (o.payment_status === 'paid') revByDay[key] += parseFloat(o.total) || 0;
  }

  // ---- Traffic / visitors over the selected range ----
  const pageViews = await store.page_views.findSince(prevStart.toISOString());

  const visByDay = Object.fromEntries(days.map((d) => [d, 0]));
  const uniqByDay = Object.fromEntries(days.map((d) => [d, new Set()]));
  const pageCounts = {};
  const uniqueVisitorsRange = new Set();
  let visitsRange = 0;
  let visitsPrev = 0; // previous comparable window (for the delta)

  for (const v of pageViews) {
    const t = new Date(v.created_at);
    const key = dayKey(v.created_at);
    if (key != null && key in visByDay) {
      visByDay[key] += 1;
      if (v.visitor_id) uniqByDay[key].add(v.visitor_id);
    }
    if (t >= startDate && t <= endDate) {
      visitsRange += 1;
      if (v.visitor_id) uniqueVisitorsRange.add(v.visitor_id);
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    } else if (t >= prevStart && t <= prevEnd) {
      visitsPrev += 1;
    }
  }

  const trafficSeries = days.map((d) => ({
    date: d,
    visits: visByDay[d] || 0,
    uniques: uniqByDay[d].size,
  }));

  const topPages = Object.entries(pageCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const totalVisits = await store.page_views.count();

  const timeseries = days.map((d) => ({
    date: d,
    revenue: Math.round((revByDay[d] || 0) * 100) / 100,
    orders: ordByDay[d] || 0,
    visits: visByDay[d] || 0,
  }));

  // ---- Orders grouped by status (within range) ----
  const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const o of ordersInRange) {
    if (o.status in statusCounts) statusCounts[o.status] += 1;
  }
  const ordersByStatus = STATUSES.map((s) => ({ status: s, count: statusCounts[s] }));

  // ---- Aggregate totals for the range ----
  const revenueRange = timeseries.reduce((s, d) => s + d.revenue, 0);
  const ordersRange = timeseries.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = paidInRange.length ? revenueRange / paidInRange.length : 0;

  // ---- Previous-period deltas (range vs the comparable window before it) ----
  let revenuePrev = 0;
  let ordersPrev = 0;
  const newCustomersRange = new Set();
  let customersPrev = 0;
  for (const o of allOrders) {
    const t = new Date(o.created_at);
    if (t >= prevStart && t <= prevEnd) {
      ordersPrev += 1;
      if (o.payment_status === 'paid') revenuePrev += parseFloat(o.total) || 0;
    }
  }
  const allCustomers = (await store.users.findAll()).filter((u) => u.role === 'customer');
  for (const u of allCustomers) {
    const t = new Date(u.created_at);
    if (t >= startDate && t <= endDate) newCustomersRange.add(u.id);
    else if (t >= prevStart && t <= prevEnd) customersPrev += 1;
  }

  const deltas = {
    revenue: pctChange(revenueRange, revenuePrev),
    orders: pctChange(ordersRange, ordersPrev),
    customers: pctChange(newCustomersRange.size, customersPrev),
    visitors: pctChange(visitsRange, visitsPrev),
  };

  // ---- Sales by category (from paid order items IN RANGE) ----
  const products = await store.products.findAll();
  const categories = await store.categories.findAll();
  const catNameById = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const prodCatById = Object.fromEntries(products.map((p) => [p.id, p.category_id]));

  const paidRangeIds = new Set(paidInRange.map((o) => o.id));
  const orderItems = await store.order_items.findAll();

  const catRevenue = {};
  const productRevenue = {};
  const productQty = {};
  for (const it of orderItems) {
    if (!paidRangeIds.has(it.order_id)) continue;
    const line = (parseFloat(it.price) || 0) * (it.quantity || 0);
    // by category
    const catId = prodCatById[it.product_id];
    const catName = catNameById[catId] || 'Uncategorized';
    catRevenue[catName] = (catRevenue[catName] || 0) + line;
    // by product
    const name = it.product_name || `#${it.product_id}`;
    productRevenue[name] = (productRevenue[name] || 0) + line;
    productQty[name] = (productQty[name] || 0) + (it.quantity || 0);
  }

  const salesByCategory = Object.entries(catRevenue)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((row, i) => ({ ...row, color: PALETTE[i % PALETTE.length] }));

  const topProducts = Object.keys(productQty)
    .map((name) => ({ name, qty: productQty[name], revenue: Math.round(productRevenue[name] * 100) / 100 }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
    .map((row, i) => ({ ...row, color: PALETTE[i % PALETTE.length] }));

  // ---- Revenue buckets: weekly (8w) + monthly (6m) for the toggle chart ----
  const weeks = lastNWeeks(8);
  const months = lastNMonths(6);
  const weekMap = Object.fromEntries(weeks.map((w) => [w.key, 0]));
  const monthMap = Object.fromEntries(months.map((m) => [m.key, 0]));
  for (const o of paidOrders) {
    const total = parseFloat(o.total) || 0;
    const wi = weekInfo(o.created_at);
    if (wi && wi.key in weekMap) weekMap[wi.key] += total;
    const mk = monthKey(o.created_at);
    if (mk && mk in monthMap) monthMap[mk] += total;
  }
  const salesBuckets = {
    weekly: weeks.map((w) => ({ label: w.label, value: Math.round(weekMap[w.key] * 100) / 100 })),
    monthly: months.map((m) => ({ label: m.label, value: Math.round(monthMap[m.key] * 100) / 100 })),
  };

  const lowStock = products
    .filter((p) => p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }));

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const unreadMessages = await store.contact_messages.countUnread();
  const allMessages = await store.contact_messages.findAll();
  const recentMessages = allMessages.slice(0, 5);

  // ---- Country / region breakdown: orders + traffic + inquiries (in range) ----
  // Orders → shipping_country; traffic/inquiries → geo-resolved country code
  // (backfilled from stored IP for rows created before geo capture existed).
  const messagesInRange = allMessages.filter((m) => {
    const t = new Date(m.created_at);
    return t >= startDate && t <= endDate;
  });

  // Inquiries per day → merge into the timeseries so the trend chart can plot
  // traffic · orders · inquiries as three lines over the range.
  const inqByDay = Object.fromEntries(days.map((d) => [d, 0]));
  for (const m of messagesInRange) {
    const k = dayKey(m.created_at);
    if (k != null && k in inqByDay) inqByDay[k] += 1;
  }
  timeseries.forEach((t) => {
    t.inquiries = inqByDay[t.date] || 0;
  });

  const countryMap = new Map(); // key -> { name, code, orders, traffic, inquiries }
  const bumpCountry = (raw, field) => {
    const norm = normalizeCountry(raw);
    const key = norm ? norm.key : '__unknown__';
    const name = norm ? norm.name : 'Unknown';
    if (!countryMap.has(key)) countryMap.set(key, { name, code: null, orders: 0, traffic: 0, inquiries: 0 });
    const row = countryMap.get(key);
    if (norm && norm.code && !row.code) row.code = norm.code; // remember ISO code for flag
    row[field] += 1;
  };

  for (const o of ordersInRange) bumpCountry(o.shipping_country, 'orders');
  for (const v of pageViews) {
    const t = new Date(v.created_at);
    if (t < startDate || t > endDate) continue;
    const cc = v.country || (v.ip ? lookupCountry(v.ip)?.code : null);
    bumpCountry(cc, 'traffic');
  }
  for (const m of messagesInRange) bumpCountry(m.country, 'inquiries');

  // Rank known countries by combined activity; append Unknown last (dev/localhost
  // traffic and pre-geo rows land here, so it shouldn't crowd out real countries).
  const countryRows = [...countryMap.values()].map((r) => ({ ...r, total: r.orders + r.traffic + r.inquiries }));
  const knownCountries = countryRows.filter((r) => r.name !== 'Unknown').sort((a, b) => b.total - a.total);
  const unknownCountry = countryRows.find((r) => r.name === 'Unknown');
  const topCountries = knownCountries.slice(0, 8);
  if (unknownCountry && unknownCountry.total > 0) topCountries.push(unknownCountry);

  const countryBreakdown = {
    countries: topCountries,
    totals: {
      orders: countryRows.reduce((s, r) => s + r.orders, 0),
      traffic: countryRows.reduce((s, r) => s + r.traffic, 0),
      inquiries: countryRows.reduce((s, r) => s + r.inquiries, 0),
    },
  };

  // ---- Extra headline metrics for the top stat cards ----
  const paidCountRange = paidInRange.length;
  const conversionRate = visitsRange > 0 ? Math.round((ordersRange / visitsRange) * 1000) / 10 : 0;

  res.json({
    range: { start: ymd(startDate), end: ymd(endDate), days: days.length },
    // lifetime totals
    productCount,
    categoryCount,
    orderCount,
    customerCount,
    revenue,
    // range-scoped headline numbers
    revenueRange: Math.round(revenueRange * 100) / 100,
    ordersRange,
    paidCountRange,
    newCustomersRange: newCustomersRange.size,
    conversionRate,
    // kept for backwards compat with any older references
    revenue30: Math.round(revenueRange * 100) / 100,
    orders30: ordersRange,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    timeseries,
    ordersByStatus,
    lowStock,
    recentOrders,
    unreadMessages,
    recentMessages,
    // ---- analytics ----
    deltas,
    visitors: {
      total: totalVisits,
      visits30: visitsRange,
      visitsRange,
      unique30: uniqueVisitorsRange.size,
      uniqueRange: uniqueVisitorsRange.size,
      series: trafficSeries,
      topPages,
    },
    salesByCategory,
    topProducts,
    salesBuckets,
    countryBreakdown,
  });
};
