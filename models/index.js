const UserModel = require('./userModel');
const CategoryModel = require('./categoryModel');
const ProductModel = require('./productModel');
const ProductImageModel = require('./productImageModel');
const OrderModel = require('./orderModel');
const OrderItemModel = require('./orderItemModel');
const SettingsModel = require('./settingsModel');
const HeroContentModel = require('./heroContentModel');
const ContactMessageModel = require('./contactMessageModel');
const PageViewModel = require('./pageViewModel');
const SizeGuideModel = require('./sizeGuideModel');
const TestimonialModel = require('./testimonialModel');

module.exports = {
  users: UserModel,
  categories: CategoryModel,
  products: ProductModel,
  product_images: ProductImageModel,
  orders: OrderModel,
  order_items: OrderItemModel,
  settings: SettingsModel,
  heroContent: HeroContentModel,
  contact_messages: ContactMessageModel,
  page_views: PageViewModel,
  size_guides: SizeGuideModel,
  testimonials: TestimonialModel,
};
