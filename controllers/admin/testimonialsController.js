const { testimonials } = require('../../models');

exports.list = async (req, res) => {
  const data = await testimonials.findAll();
  res.json(data);
};

exports.getOne = async (req, res) => {
  const data = await testimonials.findById(req.params.id);
  if (!data) return res.status(404).json({ error: 'Testimonial not found' });
  res.json(data);
};

exports.create = async (req, res) => {
  const data = await testimonials.create(req.body);
  res.status(201).json(data);
};

exports.update = async (req, res) => {
  const data = await testimonials.update(req.params.id, req.body);
  res.json(data);
};

exports.remove = async (req, res) => {
  await testimonials.delete(req.params.id);
  res.status(204).end();
};
