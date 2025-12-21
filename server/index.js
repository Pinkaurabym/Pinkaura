import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Check if running on Render
const isRender = process.env.RENDER === 'true';
if (isRender) {
  console.warn('⚠️  Running on Render with ephemeral filesystem.');
  console.warn('   Using Supabase for data persistence.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Supabase
const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role if provided to avoid RLS surprises; fall back to anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
let supabase = null;
let supabaseAvailable = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    supabaseAvailable = true;
    const urlHost = (() => {
      try { return new URL(supabaseUrl).host; } catch { return 'unknown-host'; }
    })();
    console.log(`✅ Supabase client initialised (host: ${urlHost}, key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service-role' : 'anon'})`);
  } catch (err) {
    console.error('❌ Supabase client init failed:', err.message);
    supabaseAvailable = false;
  }
} else {
  console.warn('⚠️ Supabase URL or key missing; API will fall back to JSON file.');
}

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
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
 * Add a new product with Cloudinary image upload
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

    if (!req.body.productData) {
      console.error('ProductData is missing from request body');
      return res.status(400).json({
        success: false,
        message: 'Product data is missing from request'
      });
    }

    let productData;
    try {
      productData = JSON.parse(req.body.productData);
      console.log('Parsed productData:', productData);
      console.log('Stock value:', productData.stock, 'Type:', typeof productData.stock);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(400).json({
        success: false,
        message: `Invalid product data format: ${parseError.message}`
      });
    }

    const imageUrl = req.file.path;
    const cloudinaryPublicId = req.file.filename;

    const newProductData = {
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      trending: productData.trending,
      best_seller: productData.bestSeller,
      cloudinary_id: cloudinaryPublicId,
      color: productData.color,
      image_url: imageUrl,
      stock: parseInt(productData.stock)
    };

    let newProduct;

    if (supabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([newProductData])
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        newProduct = data[0];
        console.log('✅ Product saved to Supabase');
      } catch (dbError) {
        console.error('Supabase error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
    } else {
      // Fallback to JSON file
      const productsFilePath = path.join(__dirname, '../public/data/products.json');
      
      let products = [];
      try {
        const productsFile = await fs.readFile(productsFilePath, 'utf-8');
        if (productsFile.trim()) {
          products = JSON.parse(productsFile);
        }
      } catch (readError) {
        console.warn('Could not read products.json:', readError.message);
        products = [];
      }

      const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
      
      newProduct = {
        id: maxId + 1,
        name: productData.name,
        price: parseFloat(productData.price),
        category: productData.category,
        description: productData.description,
        trending: productData.trending,
        best_seller: productData.bestSeller,
        cloudinary_id: cloudinaryPublicId,
        variants: [
          {
            color: productData.color,
            images: [imageUrl],
            stock: parseInt(productData.stock)
          }
        ]
      };

      products.push(newProduct);

      try {
        await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
        console.log('⚠️  Product saved to JSON file (NOT PERSISTENT ON RENDER)');
      } catch (writeError) {
        console.error('❌ Failed to write products.json:', writeError);
        throw new Error(`File write error: ${writeError.message}`);
      }
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
    let products;

    if (supabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        // Transform Supabase data to match expected format
        products = (data || []).map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          description: product.description,
          trending: product.trending,
          bestSeller: product.best_seller,
          cloudinaryId: product.cloudinary_id,
          variants: [
            {
              color: product.color,
              images: [product.image_url],
              stock: product.stock
            }
          ]
        }));

        console.log(`📦 Retrieved ${products.length} products from Supabase`);
      } catch (dbError) {
        console.error('Supabase error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
    } else {
      // Fallback to JSON file
      const productsFilePath = path.join(__dirname, '../public/data/products.json');
      try {
        const productsFile = await fs.readFile(productsFilePath, 'utf-8');
        products = productsFile.trim() ? JSON.parse(productsFile) : [];
        console.log(`📦 Retrieved ${products.length} products from JSON file`);
      } catch (readError) {
        console.warn('Could not read products.json:', readError.message);
        products = [];
      }
    }

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error reading products:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to read products'
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product and its Cloudinary image
 */
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    let product;

    if (supabaseAvailable) {
      try {
        // First get the product to find the cloudinary ID
        const { data: productData, error: selectError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (selectError || !productData) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        product = productData;

        // Delete from database
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (deleteError) {
          console.error('Supabase delete error:', deleteError);
          throw new Error(`Database error: ${deleteError.message}`);
        }

        console.log('✅ Product deleted from Supabase');
      } catch (dbError) {
        console.error('Supabase error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
    } else {
      // Fallback to JSON file
      const productsFilePath = path.join(__dirname, '../public/data/products.json');
      
      try {
        const productsFile = await fs.readFile(productsFilePath, 'utf-8');
        let products = productsFile.trim() ? JSON.parse(productsFile) : [];
        
        product = products.find(p => p.id === parseInt(productId));
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        products = products.filter(p => p.id !== parseInt(productId));
        await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
        console.log('⚠️  Product deleted from JSON file (NOT PERSISTENT ON RENDER)');
      } catch (error) {
        console.error('JSON file operation error:', error);
        throw new Error(`File operation error: ${error.message}`);
      }
    }

    // Delete image from Cloudinary if it exists
    if (product && product.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(product.cloudinary_id);
        console.log(`🗑️  Deleted image from Cloudinary: ${product.cloudinary_id}`);
      } catch (err) {
        console.warn('Failed to delete Cloudinary image:', err.message);
      }
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Server is running',
    supabaseAvailable,
    message: supabaseAvailable 
      ? '✅ Using Supabase (PostgreSQL) for data persistence' 
      : '⚠️  Using JSON file storage (data will be lost on Render restart)'
  });
});

// Start server
const startServer = async () => {
  // Test Supabase connection if available
  if (supabaseAvailable) {
    try {
      const { error, count } = await supabase.from('products').select('id', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
        throw error;
      }
      console.log(`✅ Supabase reachable. Products count: ${Number.isFinite(count) ? count : 'unknown'} (head query)`);
    } catch (error) {
      console.warn('⚠️  Could not connect to Supabase:', error.message);
      console.warn('   Make sure your products table exists and credentials are correct');
      supabaseAvailable = false;
    }
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Admin API Server running on http://localhost:${PORT}`);
    console.log(`📁 Cloudinary folder: ${process.env.CLOUDINARY_FOLDER || 'pinkaura-products'}`);
    console.log(`💾 Storage: ${supabaseAvailable ? 'Supabase (PostgreSQL) ✅' : 'JSON file (Render: NOT PERSISTENT ⚠️)'}\n`);
  });
};

startServer();
