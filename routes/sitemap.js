const express = require('express');
const router = express.Router();
const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const BlogModel = require('../models/BlogModel');

router.get('/', async (req, res) => {
  try {
    // Canonical production domain for Google Search Console & Webmasters
    const baseUrl = (req.query.dev === 'true' && process.env.CLIENT_URL)
      ? process.env.CLIENT_URL.replace(/\/+$/, '')
      : (process.env.CANONICAL_URL || 'https://velmorascreation.com').replace(/\/+$/, '');

    // Fetch dynamic content from Supabase with images
    const products = await ProductModel.findAll({ include: [{ as: 'images' }] });
    const categories = await CategoryModel.findAll();
    const blogs = await BlogModel.getAll(false);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Helper to add URLs with optional lastmod & image
    const addUrl = (path, priority = '0.5', changefreq = 'weekly', lastmod = null, imageUrl = null, imageTitle = null) => {
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
      if (imageUrl) {
        const fullImg = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${fullImg}</image:loc>\n`;
        if (imageTitle) {
          const cleanTitle = imageTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          xml += `      <image:title>${cleanTitle}</image:title>\n`;
        }
        xml += `    </image:image>\n`;
      }
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

    // Dynamic Products (Single Products with clean SEO slugs & Google Image Schema)
    if (products && products.length > 0) {
      products.forEach(product => {
        const productSlugOrId = product.slug || product.id;
        const mainImg = product.images?.find(i => i.is_main)?.url || product.images?.[0]?.url;
        addUrl(`/products/${productSlugOrId}`, '0.9', 'daily', product.updated_at || product.created_at, mainImg, product.name);
      });
    }

    // Dynamic Published Blogs
    if (blogs && blogs.length > 0) {
      blogs.forEach(blog => {
        if (blog.slug) {
          addUrl(`/blogs/${encodeURIComponent(blog.slug)}`, '0.8', 'daily', blog.updated_at || blog.created_at, blog.featured_image, blog.title);
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
