const { size_guides } = require('../../models');

const AdminSizeGuideController = {
  async getAll(req, res) {
    try {
      const data = await size_guides.findAll();
      res.json(data);
    } catch (err) {
      console.error('Admin Size Guide Error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { title, columns, rows, sort_order, active } = req.body;
      const created = await size_guides.create({ title, columns, rows, sort_order, active });
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await size_guides.update(id, updates);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await size_guides.delete(id);
      res.json({ message: 'Size guide deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AdminSizeGuideController;
