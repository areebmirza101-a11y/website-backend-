const { store } = require('../utils/data_store');
const PromotionModel = require('../models/promotionModel');
const createError = require('http-errors');

exports.getPromotions = async (req, res) => {
  const promos = await PromotionModel.findAll({ where: req.query });
  res.json(promos);
};

exports.getPromotion = async (req, res) => {
  const promo = await PromotionModel.findById(req.params.id);
  if (!promo) throw createError(404, 'Promotion not found');
  res.json(promo);
};

exports.createPromotion = async (req, res) => {
  const data = { ...req.body };
  if (req.files && req.files.banner_image_file && req.files.banner_image_file[0]) {
    data.banner_image_url = `/uploads/${req.files.banner_image_file[0].filename}`;
  }
  
  if (data.target_ids && typeof data.target_ids === 'string') {
    try {
      data.target_ids = JSON.parse(data.target_ids);
    } catch(e) {
      data.target_ids = [];
    }
  }

  const promo = await PromotionModel.create(data);
  res.status(201).json(promo);
};

exports.updatePromotion = async (req, res) => {
  const promo = await PromotionModel.findById(req.params.id);
  if (!promo) throw createError(404, 'Promotion not found');

  const data = { ...req.body };
  if (req.files && req.files.banner_image_file && req.files.banner_image_file[0]) {
    data.banner_image_url = `/uploads/${req.files.banner_image_file[0].filename}`;
  }

  if (data.target_ids && typeof data.target_ids === 'string') {
    try {
      data.target_ids = JSON.parse(data.target_ids);
    } catch(e) {
      data.target_ids = [];
    }
  }

  const updated = await PromotionModel.update(promo.id, data);
  res.json(updated);
};

exports.deletePromotion = async (req, res) => {
  const promo = await PromotionModel.findById(req.params.id);
  if (!promo) throw createError(404, 'Promotion not found');
  await PromotionModel.delete(promo.id);
  res.json({ success: true });
};
