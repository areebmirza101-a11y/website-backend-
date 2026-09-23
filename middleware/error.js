// Central error handler — returns JSON for the API
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err && err.name === 'ZodError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path.join('.') || 'body', message: e.message })),
    });
  }

  if (err && err.code && /^(P|F)/.test(err.code)) {
    const status = err.code.startsWith('P') ? 400 : 500;
    return res.status(status).json({
      message: err.message || 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.details || err.hint : undefined,
    });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    message: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
