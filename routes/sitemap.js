const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel');
const CategoryModel = require('../models/CategoryModel');
const BlogModel = require('../models/BlogModel');

router.get('/', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://www.velmorascreation.com';
    
    // Fetch dynamic content
    const products = await ProductModel.getAll();
    const categories = await CategoryModel.getAll();
    const blogs = await BlogModel.getAll(false);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Helper to add URLs
    const addUrl = (path, priority = '0.5', changefreq = 'weekly') => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${path}</loc>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    };

    // Static pages
    addUrl('/', '1.0', 'daily');
    addUrl('/products', '0.9', 'daily');
    addUrl('/about', '0.8', 'monthly');
    addUrl('/contact', '0.8', 'monthly');
    addUrl('/blogs', '0.9', 'daily');
    addUrl('/privacy', '0.3', 'yearly');
    addUrl('/terms', '0.3', 'yearly');
    addUrl('/shipping', '0.5', 'yearly');
    addUrl('/returns', '0.5', 'yearly');
    addUrl('/size-guide', '0.6', 'monthly');
    addUrl('/products?on_sale=true', '0.8', 'daily');
    
    // Dynamic Categories
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        if (cat.slug) addUrl(`/products?category=${cat.slug}`, '0.8', 'weekly');
      });
    }

    // Dynamic Products
    if (products && products.length > 0) {
      products.forEach(product => {
        addUrl(`/products/${product.id}`, '0.9', 'daily'); // Using ID since the frontend uses /products/:id
      });
    }

    // Dynamic Blogs
    if (blogs && blogs.length > 0) {
      blogs.forEach(blog => {
        addUrl(`/blogs/${blog.slug}`, '0.8', 'daily');
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
