const { size_guides } = require('../models');

const SizeGuideController = {
  async getActive(req, res) {
    try {
      const data = await size_guides.findActive();
      res.json(data);
    } catch (err) {
      console.error('Size Guide Error:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = SizeGuideController;
