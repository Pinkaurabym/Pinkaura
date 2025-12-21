import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Load environment variables
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Check if running on Render (ephemeral filesystem)
const isRender = process.env.RENDER === 'true';
if (isRender) {
  console.warn('⚠️  WARNING: Running on Render with ephemeral filesystem.');
  console.warn('   Products saved to JSON files will be lost on dyno restart.');
  console.warn('   Please migrate to a proper database (MongoDB, PostgreSQL, etc.)');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: process.env.CLOUDINARY_FOLDER || 'pinkaura-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Optional: optimize images
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * POST /api/products
 * Add a new product to products.json with Cloudinary image upload
 */
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    console.log('=== Upload Request Received ===');
    console.log('File:', req.file ? 'Present' : 'Missing');
    console.log('Body keys:', Object.keys(req.body));
    console.log('ProductData raw:', req.body.productData);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    // Check if productData exists
    if (!req.body.productData) {
      console.error('ProductData is missing from request body');
      return res.status(400).json({
        success: false,
        message: 'Product data is missing from request'
      });
    }

    // Parse productData with error handling
    let productData;
    try {
      productData = JSON.parse(req.body.productData);
      console.log('Parsed productData:', productData);
      console.log('Stock value:', productData.stock, 'Type:', typeof productData.stock);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw productData that failed to parse:', req.body.productData);
      return res.status(400).json({
        success: false,
        message: `Invalid product data format: ${parseError.message}`
      });
    }

    const productsFilePath = path.join(__dirname, '../public/data/products.json');

    // Read existing products with error handling
    let products = [];
    try {
      const productsFile = await fs.readFile(productsFilePath, 'utf-8');
      if (productsFile.trim()) {
        products = JSON.parse(productsFile);
      }
    } catch (readError) {
      console.warn('Could not read products.json, starting with empty array:', readError.message);
      products = [];
    }

    // Generate new ID
    const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
    const newId = maxId + 1;

    // Get Cloudinary URL from uploaded file
    const imageUrl = req.file.path; // Cloudinary URL
    const cloudinaryPublicId = req.file.filename; // Cloudinary public_id

    // Create product object with Cloudinary URL
    const newProduct = {
      id: newId,
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      trending: productData.trending,
      bestSeller: productData.bestSeller,
      cloudinaryId: cloudinaryPublicId, // Store for deletion later
      variants: [
        {
          color: productData.color,
          images: [imageUrl], // Use Cloudinary URL instead of local path
          stock: parseInt(productData.stock)
        }
      ]
    };

    // Add to products array
    products.push(newProduct);

    console.log('New product to save:', JSON.stringify(newProduct, null, 2));
    console.log('Total products after adding:', products.length);
    console.log('File path:', productsFilePath);

    // Write back to file
    try {
      await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
      console.log('✅ Product successfully written to file');
    } catch (writeError) {
      console.error('❌ Failed to write products.json:', writeError);
      throw writeError;
    }

    res.json({
      success: true,
      message: 'Product added successfully',
      product: newProduct
    });

  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add product'
    });
  }
});

/**
 * GET /api/products
 * Get all products
 */
app.get('/api/products', async (req, res) => {
  try {
    const productsFilePath = path.join(__dirname, '../public/data/products.json');
    const productsFile = await fs.readFile(productsFilePath, 'utf-8');
    const products = JSON.parse(productsFile);
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error reading products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read products'
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product and its Cloudinary image
 */
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productsFilePath = path.join(__dirname, '../public/data/products.json');

    // Read existing products
    const productsFile = await fs.readFile(productsFilePath, 'utf-8');
    let products = JSON.parse(productsFile);

    // Find product
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete image from Cloudinary if cloudinaryId exists
    if (product.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(product.cloudinaryId);
        console.log(`Deleted image from Cloudinary: ${product.cloudinaryId}`);
      } catch (err) {
        console.warn('Failed to delete Cloudinary image:', err.message);
      }
    }

    // Remove from products
    products = products.filter(p => p.id !== productId);

    // Write back to file
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Server is running',
    storage: 'JSON file (Render: NOT PERSISTENT)',
    warning: '⚠️  Data will be lost on Render server restart. Use MongoDB for persistent storage.',
    mongoSetupGuide: 'See MONGODB_SETUP.md for instructions'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Admin API Server running on http://localhost:${PORT}`);
  console.log(`📁 Cloudinary folder: ${process.env.CLOUDINARY_FOLDER || 'pinkaura-products'}`);
  if (isRender) {
    console.log('\n⚠️  IMPORTANT: This server is using JSON file storage on Render.');
    console.log('   Products will be LOST when the server restarts.');
    console.log('   See MONGODB_SETUP.md for how to use MongoDB.\n');
  }
});
