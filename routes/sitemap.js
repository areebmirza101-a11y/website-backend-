const express = require('express');
const router = express.Router();
const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const BlogModel = require('../models/BlogModel');

router.get('/', async (req, res) => {
  try {
    const baseUrl = (process.env.CLIENT_URL || 'https://velmorascreation.com').replace(/\/+$/, '');

    // Fetch dynamic content from Supabase
    const products = await ProductModel.findAll();
    const categories = await CategoryModel.findAll();
    const blogs = await BlogModel.getAll(false);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Helper to add URLs with optional lastmod
    const addUrl = (path, priority = '0.5', changefreq = 'weekly', lastmod = null) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${path}</loc>\n`;
      if (lastmod) {
        try {
          const dateStr = new Date(lastmod).toISOString().split('T')[0];
          xml += `    <lastmod>${dateStr}</lastmod>\n`;
        } catch {
          // ignore date parse issues
        }
      }
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    };

    const today = new Date().toISOString().split('T')[0];

    // Static core pages
    addUrl('/', '1.0', 'daily', today);
    addUrl('/products', '0.9', 'daily', today);
    addUrl('/about', '0.8', 'monthly');
    addUrl('/contact', '0.8', 'monthly');
    addUrl('/blogs', '0.9', 'daily', today);
    addUrl('/size-guide', '0.7', 'monthly');
    addUrl('/products?on_sale=true', '0.8', 'daily', today);
    addUrl('/shipping', '0.5', 'yearly');
    addUrl('/returns', '0.5', 'yearly');
    addUrl('/privacy', '0.3', 'yearly');
    addUrl('/terms', '0.3', 'yearly');

    // Dynamic Categories
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        if (cat.slug) {
          addUrl(`/products?category=${encodeURIComponent(cat.slug)}`, '0.8', 'weekly', cat.updated_at || cat.created_at);
        }
      });
    }

    // Dynamic Products
    if (products && products.length > 0) {
      products.forEach(product => {
        addUrl(`/products/${product.id}`, '0.9', 'daily', product.updated_at || product.created_at);
      });
    }

    // Dynamic Published Blogs
    if (blogs && blogs.length > 0) {
      blogs.forEach(blog => {
        if (blog.slug) {
          addUrl(`/blogs/${encodeURIComponent(blog.slug)}`, '0.8', 'daily', blog.updated_at || blog.created_at);
        }
      });
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
