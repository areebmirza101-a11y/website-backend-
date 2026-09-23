const { testimonials } = require('../models');

exports.list = async (req, res) => {
  const data = await testimonials.findAll();
  res.json(data);
};
