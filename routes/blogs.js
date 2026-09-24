const express = require('express');
const router = express.Router();
const BlogModel = require('../models/BlogModel');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all blogs (public, only published)
router.get('/', async (req, res) => {
  try {
    const blogs = await BlogModel.getAll(false);
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all blogs including drafts (admin only)
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const blogs = await BlogModel.getAll(true);
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single blog by slug (public, only published)
router.get('/:slug', async (req, res) => {
  try {
    const blog = await BlogModel.getBySlug(req.params.slug, false);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single blog by id for editing (admin only)
router.get('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const blog = await BlogModel.getById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a blog (admin only)
router.post('/', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const blogData = { ...req.body };
    if (req.file) {
      blogData.image_url = `/uploads/${req.file.filename}`;
    }
    
    // Parse boolean and JSON fields from FormData
    if (typeof blogData.is_published === 'string') blogData.is_published = blogData.is_published === 'true';
    if (typeof blogData.faq_schema_enabled === 'string') blogData.faq_schema_enabled = blogData.faq_schema_enabled === 'true';
    if (typeof blogData.faqs === 'string') blogData.faqs = JSON.parse(blogData.faqs || '[]');
    if (typeof blogData.related_articles === 'string') blogData.related_articles = JSON.parse(blogData.related_articles || '[]');
    // Basic validation
    if (!blogData.title || !blogData.slug || !blogData.content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }
    const newBlog = await BlogModel.create(blogData);
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a blog (admin only)
router.put('/:id', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const blogData = { ...req.body };
    if (req.file) {
      blogData.image_url = `/uploads/${req.file.filename}`;
    }

    // Parse boolean and JSON fields from FormData
    if (typeof blogData.is_published === 'string') blogData.is_published = blogData.is_published === 'true';
    if (typeof blogData.faq_schema_enabled === 'string') blogData.faq_schema_enabled = blogData.faq_schema_enabled === 'true';
    if (typeof blogData.faqs === 'string') blogData.faqs = JSON.parse(blogData.faqs || '[]');
    if (typeof blogData.related_articles === 'string') blogData.related_articles = JSON.parse(blogData.related_articles || '[]');
    const updatedBlog = await BlogModel.update(req.params.id, blogData);
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a blog (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await BlogModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
