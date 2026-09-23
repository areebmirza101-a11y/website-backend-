require('dotenv').config();
const bcrypt = require('bcryptjs');
const { store } = require('../utils/data_store');

const slugify = (s) =>
  s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const imgMap = {
  'oxford,shirt': '1551028715-4034f6dd4b3a', 'denim,jeans': '1542272617-08d257d3fa3a',
  'wool,sweater': '1434389677669-e5b4d3725d3c', 'floral,dress': '1572804013309-59a88b7e92f1',
  'leggings,activewear': '1506629082957-2a1b2a1b2a1b', 'cardigan,knit': '1516762681-397d4f5d1a92',
  'silk,blouse': '1485462537746-989021f0a56e', 'women,jeans': '1541099644555-a6352c8e2a5c',
  'turtleneck,women': '1485968579580-b6d095142e6e', 'kids,tshirt': '1519238361896-aa16bdb9b57c',
  'kids,jacket': '1471286174890-9e68c4c5a3b1', 'kids,overalls': '1522337360788-8b27de2f2e3a',
  'rain,boots': '1503342218256-3c4c3d2a8a3b', 'canvas,tote,bag': '1544816155-12c7a68a6c3a',
  'leather,belt': '1553062407-98eeb64b6d62', 'beanie,hat': '1521361432960-3d2b2b2b2b2b',
  'sunglasses': '1572631996438-1b5c6c2a8b8c', 'wallet,leather': '1553062407-98eeb64b6d62',
  'linen,shirt': '1596755094514-f87e520f3a2c', 'polo,shirt': '1488161628813-04466f8725a8',
  'chino,pants': '1473966968600-fa801b869a1f', 'blazer,men': '1507003211169-0a1dd7228f2d',
};
const img = (kw) => `https://images.unsplash.com/photo-${imgMap[kw] || '1516762681-397d4f5d1a92'}?w=800&h=1000&fit=crop`;

const categories = [
  { name: 'Men', description: "Men's clothing — shirts, tees, outerwear and more." },
  { name: 'Women', description: "Women's fashion for every occasion." },
  { name: 'Kids', description: 'Comfortable, durable clothing for children.' },
  { name: 'Accessories', description: 'Bags, belts, caps and finishing touches.' },
];

const products = [
  { name: 'Classic Oxford Shirt', category: 'Men', price: 39.99, material: '100% Cotton', sizes: ['S','M','L','XL'], colors: ['White','Sky Blue'], stock: 120, featured: true, img: 'oxford,shirt', description: 'A timeless button-down Oxford shirt tailored for a crisp, versatile look.' },
  { name: 'Slim Fit Denim Jeans', category: 'Men', price: 54.5, material: 'Denim (98% Cotton, 2% Elastane)', sizes: ['30','32','34','36'], colors: ['Indigo','Black'], stock: 80, featured: true, img: 'denim,jeans', description: 'Stretch slim-fit jeans with a modern taper and durable stitching.' },
  { name: 'Merino Wool Sweater', category: 'Men', price: 69.0, material: '100% Merino Wool', sizes: ['S','M','L','XL'], colors: ['Charcoal','Navy'], stock: 45, img: 'wool,sweater', description: 'Lightweight merino knit that regulates temperature and resists odor.' },
  { name: 'Linen Button Shirt', category: 'Men', price: 44.0, material: '100% Linen', sizes: ['S','M','L','XL'], colors: ['Sand','White'], stock: 65, img: 'linen,shirt', description: 'Breathable linen shirt, perfect for warm-weather layering.' },
  { name: 'Casual Polo Shirt', category: 'Men', price: 34.99, material: 'Pique Cotton', sizes: ['S','M','L','XL','XXL'], colors: ['Navy','White','Burgundy'], stock: 95, featured: true, img: 'polo,shirt', description: 'Classic pique polo with a relaxed fit and mother-of-pearl buttons.' },
  { name: 'Slim Fit Chino Pants', category: 'Men', price: 49.99, material: 'Stretch Cotton Twill', sizes: ['30','32','34','36'], colors: ['Khaki','Olive','Navy'], stock: 70, img: 'chino,pants', description: 'Versatile chinos with a modern slim fit and comfortable stretch.' },
  { name: 'Wool Blend Blazer', category: 'Men', price: 129.0, material: 'Wool/Polyester Blend', sizes: ['S','M','L','XL'], colors: ['Charcoal','Navy'], stock: 25, img: 'blazer,men', description: 'Structured half-canvas blazer suitable for business and events.' },
  { name: 'Floral Summer Dress', category: 'Women', price: 48.0, material: 'Viscose', sizes: ['XS','S','M','L'], colors: ['Coral','Green'], stock: 60, featured: true, img: 'floral,dress', description: 'Breezy floral midi dress with a flattering wrap silhouette.' },
  { name: 'High-Waist Leggings', category: 'Women', price: 29.99, material: 'Nylon/Spandex', sizes: ['XS','S','M','L','XL'], colors: ['Black','Olive'], stock: 150, img: 'leggings,activewear', description: 'Squat-proof, high-waist leggings with a hidden pocket.' },
  { name: 'Oversized Knit Cardigan', category: 'Women', price: 58.0, material: 'Acrylic Blend', sizes: ['S','M','L'], colors: ['Cream','Rust'], stock: 40, img: 'cardigan,knit', description: 'Cozy oversized cardigan with drop shoulders and deep pockets.' },
  { name: 'Silk Blouse', category: 'Women', price: 62.0, material: '100% Silk', sizes: ['XS','S','M','L'], colors: ['Ivory','Blush','Black'], stock: 35, featured: true, img: 'silk,blouse', description: 'Elegant silk blouse with a relaxed fit and mother-of-pearl buttons.' },
  { name: 'High-Rise Skinny Jeans', category: 'Women', price: 59.99, material: 'Denim (Cotton/Elastane)', sizes: ['24','26','28','30','32'], colors: ['Dark Wash','Light Wash','Black'], stock: 85, img: 'women,jeans', description: 'Classic high-rise skinny jeans that sculpt and elongate.' },
  { name: 'Cashmere Turtleneck', category: 'Women', price: 95.0, material: '100% Cashmere', sizes: ['XS','S','M','L'], colors: ['Camel','Grey','Black'], stock: 20, img: 'turtleneck,women', description: 'Luxuriously soft cashmere turtleneck for cool-weather elegance.' },
  { name: 'Kids Graphic Tee', category: 'Kids', price: 16.99, material: '100% Organic Cotton', sizes: ['2T','3T','4T','5-6Y'], colors: ['Yellow','Blue'], stock: 200, img: 'kids,tshirt', description: 'Soft organic-cotton tee with a fun printed graphic.' },
  { name: 'Kids Hooded Jacket', category: 'Kids', price: 34.0, material: 'Polyester Shell', sizes: ['3-4Y','5-6Y','7-8Y'], colors: ['Red','Navy'], stock: 55, featured: true, img: 'kids,jacket', description: 'Water-resistant hooded jacket with fleece lining for chilly days.' },
  { name: 'Kids Denim Overalls', category: 'Kids', price: 28.99, material: '100% Cotton Denim', sizes: ['2T','3T','4T','5-6Y'], colors: ['Light Wash','Dark Wash'], stock: 60, img: 'kids,overalls', description: 'Adjustable denim overalls with a playful patchwork detail.' },
  { name: 'Kids Rain Boots', category: 'Kids', price: 24.99, material: 'Natural Rubber', sizes: ['S (US 6-8)','M (US 9-11)','L (US 12-2)'], colors: ['Yellow','Pink','Green'], stock: 40, img: 'rain,boots', description: 'Easy-on rain boots with reflective strips for wet-day fun.' },
  { name: 'Canvas Tote Bag', category: 'Accessories', price: 22.0, material: 'Heavy Canvas', sizes: ['One Size'], colors: ['Natural','Black'], stock: 90, img: 'canvas,tote,bag', description: 'Roomy everyday tote with reinforced straps.' },
  { name: 'Leather Belt', category: 'Accessories', price: 27.5, material: 'Genuine Leather', sizes: ['S','M','L'], colors: ['Brown','Black'], stock: 70, img: 'leather,belt', description: 'Full-grain leather belt with a classic brushed buckle.' },
  { name: 'Wool Blend Beanie', category: 'Accessories', price: 18.0, material: 'Wool Blend', sizes: ['One Size'], colors: ['Grey','Mustard'], stock: 110, img: 'beanie,hat', description: 'Ribbed knit beanie that keeps its shape wear after wear.' },
  { name: 'Aviator Sunglasses', category: 'Accessories', price: 45.0, material: 'Metal/UV400 Lens', sizes: ['One Size'], colors: ['Gold/Green','Silver/Blue','Black/Grey'], stock: 50, featured: true, img: 'sunglasses', description: 'Classic aviator sunglasses with UV protection and a lightweight frame.' },
  { name: 'Leather Wallet', category: 'Accessories', price: 39.99, material: 'Full-Grain Leather', sizes: ['One Size'], colors: ['Brown','Black','Tan'], stock: 75, img: 'wallet,leather', description: 'Slim bifold wallet with RFID blocking and multiple card slots.' },
];

async function seed() {
  // 1. Admin user — skip if already exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
  const existing = await store.users.findByEmail(adminEmail);
  if (!existing) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await store.users.create({ name: 'Store Admin', email: adminEmail, password: hashed, role: 'admin' });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists — skipped');
  }

  // 2. Categories — skip if already exist
  let catMap = {};
  const existingCats = await store.categories.findAll();
  if (existingCats.length > 0) {
    existingCats.forEach(c => { catMap[c.name] = c.id; });
    console.log(`Categories already exist (${existingCats.length}) — skipped`);
  } else {
    for (const c of categories) {
      const cat = await store.categories.create({ ...c, slug: slugify(c.name) });
      catMap[c.name] = cat.id;
    }
    console.log(`${categories.length} categories created`);
  }

  // 3. Products — skip if already exist
  const existingProds = await store.products.findAll();
  if (existingProds.length > 0) {
    console.log(`Products already exist (${existingProds.length}) — skipped`);
  } else {
    for (const p of products) {
      const product = await store.products.create({
        name: p.name, slug: slugify(p.name), description: p.description,
        price: p.price, material: p.material, sizes: p.sizes, colors: p.colors,
        stock: p.stock, featured: !!p.featured, active: true,
        sku: slugify(p.name).toUpperCase().slice(0, 12) + '-' + Math.floor(Math.random() * 900 + 100),
        category_id: catMap[p.category],
      });
      await store.product_images.create({ url: img(p.img), product_id: product.id, is_primary: true });
    }
    console.log(`${products.length} products + images created`);
  }

  // 4. Settings — seed defaults if empty
  const settings = await store.settings.findAll ? await store.settings.findAll() : null;
  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err.message); process.exit(1); });
