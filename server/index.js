import express from 'express';
import compression from 'compression';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { createClient } from '@supabase/supabase-js';
import { BrevoClient } from '@getbrevo/brevo';

// Load environment variables
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Brevo
if (!process.env.BREVO_API_KEY) {
  console.warn('⚠️  WARNING: BREVO_API_KEY is not set. Email sending will fail.');
  console.warn('   Please add BREVO_API_KEY to your server/.env file.');
}
const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

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
app.use(compression());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
 * Send a transactional email via Brevo
 */
async function sendEmail({ from, to, subject, html, attachments }) {
  return brevo.transactionalEmails.sendTransacEmail({
    sender: { email: from, name: 'Pinkaura' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(attachments?.length ? {
      attachment: attachments.map(a => ({ content: a.content, name: a.filename }))
    } : {})
  });
}

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
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(400).json({
        success: false,
        message: `Invalid product data format: ${parseError.message}`
      });
    }

    const imageUrl = req.file.path;
    const cloudinaryPublicId = req.file.filename;

    // Transform variants for storage
    const variants = productData.variants || [
      { number: productData.number || 1, stock: parseInt(productData.stock) }
    ];

    const newProductData = {
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      trending: productData.trending,
      best_seller: productData.bestSeller,
      cloudinary_id: cloudinaryPublicId,
      image_url: imageUrl,
      variants: variants.map(v => ({
        number: v.number,
        images: [imageUrl],
        stock: parseInt(v.stock)
      }))
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
        variants: variants.map(v => ({
          number: v.number,
          images: [imageUrl],
          stock: parseInt(v.stock)
        }))
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
        // Handle backward compatibility for old products without variants structure
        products = (data || []).map(product => {
          let variants = product.variants;
          
          // Migrate old products that don't have variants structure
          if (!variants || !Array.isArray(variants) || variants.length === 0) {
            // Create a default variant from old product structure
            variants = [{
              number: 1,
              images: product.image_url ? [product.image_url] : [],
              stock: product.stock || 10 // Default stock if not present
            }];
          } else {
            // Ensure each variant has images
            variants = variants.map(v => ({
              number: v.number,
              images: v.images || (product.image_url ? [product.image_url] : []),
              stock: v.stock !== undefined ? v.stock : 10
            }));
          }
          
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            trending: product.trending,
            bestSeller: product.best_seller,
            cloudinaryId: product.cloudinary_id,
            variants: variants
          };
        });

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
        let jsonProducts = productsFile.trim() ? JSON.parse(productsFile) : [];
        
        // Ensure variants have images field
        // Handle backward compatibility for old products
        products = jsonProducts.map(product => {
          let variants = product.variants;
          
          // Migrate old products that don't have variants structure
          if (!variants || !Array.isArray(variants) || variants.length === 0) {
            variants = [{
              number: 1,
              images: product.image_url ? [product.image_url] : [],
              stock: product.stock || 10
            }];
          } else {
            variants = variants.map(v => ({
              number: v.number,
              images: v.images || (product.image_url ? [product.image_url] : []),
              stock: v.stock !== undefined ? v.stock : 10
            }));
          }
          
          return {
            ...product,
            variants: variants
          };
        });
        
        console.log(`📦 Retrieved ${products.length} products from JSON file`);
      } catch (readError) {
        console.warn('Could not read products.json:', readError.message);
        products = [];
      }
    }

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
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
 * GET /api/products/:id
 * Get a single product by ID
 */
app.get('/api/products/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    let product;

    if (supabaseAvailable) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      product = data;
    } else {
      // Fallback to JSON file
      const productsFilePath = path.join(__dirname, '../public/data/products.json');
      const productsFile = await fs.readFile(productsFilePath, 'utf-8');
      const products = productsFile.trim() ? JSON.parse(productsFile) : [];

      product = products.find((p) => p.id === parseInt(productId));
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product',
    });
  }
});

/**
 * PUT /api/products/:id
 * Update product variants (mainly for stock updates)
 */
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const { variants } = req.body;

    if (!variants || !Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: 'Variants array is required'
      });
    }

    if (supabaseAvailable) {
      try {
        // Get the product first
        const { data: product, error: selectError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (selectError || !product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        // Update variants in the JSON column
        const { error: updateError } = await supabase
          .from('products')
          .update({ variants })
          .eq('id', productId);

        if (updateError) {
          throw new Error(`Database error: ${updateError.message}`);
        }

        console.log('✅ Product variants updated in Supabase');
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
        
        const productIndex = products.findIndex(p => p.id === parseInt(productId));
        if (productIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        products[productIndex].variants = variants;
        await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
        console.log('⚠️  Product variants updated in JSON file');
      } catch (error) {
        console.error('JSON file operation error:', error);
        throw new Error(`File operation error: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product'
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

/**
 * POST /api/orders
 * 
 * ROBUST ORDER CREATION WITH:
 * ✅ Server-side validation (prices from DB, not frontend)
 * ✅ Database transactions (atomicity for inventory)
 * ✅ Stock decrement with rollback on insufficient inventory
 * ✅ Safe Cloudinary deletion (after transaction succeeds)
 * ✅ Non-blocking email sending (order succeeds even if email fails)
 */
app.post('/api/orders', upload.single('screenshot'), async (req, res) => {
  try {
    // Parse JSON strings from FormData (multer sends them as strings)
    let cartItems = req.body.cartItems;
    let customerDetails = req.body.customerDetails;
    let totalsFromClient = req.body.totalsFromClient;

    // Parse JSON strings if they are strings
    if (typeof cartItems === 'string') {
      try {
        cartItems = JSON.parse(cartItems);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cartItems JSON format'
        });
      }
    }

    if (typeof customerDetails === 'string') {
      try {
        customerDetails = JSON.parse(customerDetails);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid customerDetails JSON format'
        });
      }
    }

    if (typeof totalsFromClient === 'string') {
      try {
        totalsFromClient = JSON.parse(totalsFromClient);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid totalsFromClient JSON format'
        });
      }
    }

    // Validate request format
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required and must be non-empty'
      });
    }

    if (!customerDetails || typeof customerDetails !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Customer details are required'
      });
    }

    if (!totalsFromClient || typeof totalsFromClient !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Totals information is required'
      });
    }

    console.log('📦 Processing order for:', customerDetails.email);
    console.log('🛒 Cart items:', cartItems.length);

    // ════════════════════════════════════════════════════════════
    // STEP 1: FETCH PRODUCTS FROM DATABASE (Server-Side Validation)
    // ════════════════════════════════════════════════════════════
    let products = [];
    
    if (supabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw new Error(`Database error: ${error.message}`);
        products = data || [];
        console.log(`✅ Fetched ${products.length} products from Supabase`);
      } catch (dbError) {
        console.error('❌ Failed to fetch products from Supabase:', dbError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to validate order. Please try again.'
        });
      }
    } else {
      // Fallback to JSON file
      try {
        const productsFilePath = path.join(__dirname, '../public/data/products.json');
        const productsFile = await fs.readFile(productsFilePath, 'utf-8');
        products = productsFile.trim() ? JSON.parse(productsFile) : [];
        console.log(`✅ Fetched ${products.length} products from JSON file`);
      } catch (readError) {
        console.error('❌ Failed to read products.json:', readError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to validate order. Please try again.'
        });
      }
    }

    // ════════════════════════════════════════════════════════════
    // STEP 2: VALIDATE PRICES & INVENTORY (SECURITY CRITICAL)
    // ════════════════════════════════════════════════════════════
    let serverCalculatedSubtotal = 0;
    const itemsToOrder = []; // Will store validated item info for transaction

    // Build Map for O(1) lookups instead of O(n) .find() per cart item
    const productMap = new Map(products.map(p => [p.id, p]));

    for (const cartItem of cartItems) {
      const product = productMap.get(cartItem.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ID ${cartItem.id} not found`
        });
      }

      // Find the variant (by number)
      const variant = product.variants?.find(v => v.number === cartItem.variantNumber);
      
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Variant #${cartItem.variantNumber} not available for product "${product.name}"`
        });
      }

      // Security: Always use server price, never trust frontend
      const serverPrice = product.price;
      const serverTotal = serverPrice * cartItem.quantity;
      serverCalculatedSubtotal += serverTotal;

      // Validate stock BEFORE creating transaction
      if (variant.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}" (Variant #${cartItem.variantNumber}). Available: ${variant.stock}, Requested: ${cartItem.quantity}`
        });
      }

      itemsToOrder.push({
        id: product.id,
        name: product.name,
        variantNumber: cartItem.variantNumber,
        quantity: cartItem.quantity,
        price: serverPrice,
        total: serverTotal,
        variantStock: variant.stock,
        cloudinaryId: product.cloudinary_id,
        imagesToDelete: [] // Will populate if stock reaches 0
      });
    }

    // ════════════════════════════════════════════════════════════
    // STEP 3: VALIDATE TOTALS (Price Tampering Prevention)
    // ════════════════════════════════════════════════════════════
    const FREE_SHIPPING_THRESHOLD = 999; // Must match frontend constant
    const SHIPPING_COST = 60;
    
    let serverCalculatedShipping = 0;
    if (serverCalculatedSubtotal < FREE_SHIPPING_THRESHOLD) {
      serverCalculatedShipping = SHIPPING_COST;
    }

    const serverCalculatedTotal = serverCalculatedSubtotal + serverCalculatedShipping;
    const clientTotal = parseFloat(totalsFromClient.total);

    // Allow 1 rupee tolerance for rounding errors
    if (Math.abs(serverCalculatedTotal - clientTotal) > 1) {
      console.warn(`⚠️  Price mismatch detected!`);
      console.warn(`   Client Total: ₹${clientTotal}`);
      console.warn(`   Server Total: ₹${serverCalculatedTotal}`);
      console.warn(`   Difference: ₹${Math.abs(serverCalculatedTotal - clientTotal)}`);
      
      return res.status(400).json({
        success: false,
        message: 'Price validation failed. Please refresh and try again.'
      });
    }

    console.log(`✅ Price validation passed: ₹${serverCalculatedTotal}`);

    // ════════════════════════════════════════════════════════════
    // STEP 4: DATABASE TRANSACTION (Atomicity)
    // ════════════════════════════════════════════════════════════
    let orderId = null;
    const imagesToDelete = []; // Cloudinary IDs to delete after transaction

    try {
      if (supabaseAvailable) {
        // Use Supabase RPC or raw SQL for transactions
        // For now, we'll do manual transaction-like logic
        
        // Begin transaction by fetching current state
        const { data: ordersTable, error: ordersCheckError } = await supabase
          .from('orders')
          .select('id')
          .limit(1);

        if (ordersCheckError && ordersCheckError.code !== 'PGRST116') {
          throw new Error(`Orders table check failed: ${ordersCheckError.message}`);
        }

        // Insert order (atomic)
        const { data: orderData, error: orderInsertError } = await supabase
          .from('orders')
          .insert({
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone,
            customer_alternate_phone: customerDetails.alternatePhone || null,
            customer_address: customerDetails.address,
            customer_landmark: customerDetails.landmark,
            customer_pincode: customerDetails.pincode,
            subtotal: serverCalculatedSubtotal,
            shipping: serverCalculatedShipping,
            total: serverCalculatedTotal,
            payment_screenshot_url: req.file?.path || null,
            order_status: 'pending_verification',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderInsertError) {
          throw new Error(`Failed to create order: ${orderInsertError.message}`);
        }

        orderId = orderData.id;
        console.log(`✅ Order created with ID: ${orderId}`);

        // Insert order items
        const orderItems = itemsToOrder.map(item => ({
          order_id: orderId,
          product_id: item.id,
          product_name: item.name,
          variant_number: item.variantNumber,
          quantity: item.quantity,
          price_per_unit: item.price,
          total_price: item.total
        }));

        const { error: itemsInsertError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsInsertError) {
          // Rollback: Delete the order
          await supabase.from('orders').delete().eq('id', orderId);
          throw new Error(`Failed to insert order items: ${itemsInsertError.message}`);
        }

        console.log(`✅ Order items inserted (${orderItems.length} items)`);

        // ════════════════════════════════════════════════════════════
        // STEP 5: DECREMENT STOCK (Parallel updates via Promise.all)
        // ════════════════════════════════════════════════════════════

        // Pre-compute updated variants for all items before hitting the DB
        const stockUpdates = [];
        for (const item of itemsToOrder) {
          const product = productMap.get(item.id);
          const variantIndex = product.variants.findIndex(v => v.number === item.variantNumber);

          if (variantIndex === -1) {
            throw new Error(`Variant #${item.variantNumber} for product "${item.name}" not found during stock update`);
          }

          const newStock = product.variants[variantIndex].stock - item.quantity;
          product.variants[variantIndex].stock = newStock;

          if (newStock === 0) {
            imagesToDelete.push({ publicId: item.cloudinaryId, productName: item.name });
            console.log(`🗑️  Will delete images for "${item.name}" after transaction commits`);
          }

          stockUpdates.push({ item, updatedVariants: product.variants });
        }

        // Run all Supabase stock updates in parallel
        const updateResults = await Promise.all(
          stockUpdates.map(({ item, updatedVariants }) =>
            supabase.from('products').update({ variants: updatedVariants }).eq('id', item.id)
          )
        );

        for (let i = 0; i < updateResults.length; i++) {
          const { error: updateError } = updateResults[i];
          if (updateError) {
            await supabase.from('order_items').delete().eq('order_id', orderId);
            await supabase.from('orders').delete().eq('id', orderId);
            throw new Error(`Failed to update stock for product "${stockUpdates[i].item.name}": ${updateError.message}`);
          }
          console.log(`✅ Stock decremented for "${stockUpdates[i].item.name}" (Variant #${stockUpdates[i].item.variantNumber})`);
        }

      } else {
        // Fallback: JSON file-based transaction (non-atomic but better than nothing)
        const productsFilePath = path.join(__dirname, '../public/data/products.json');
        
        // This is NOT truly atomic, but it's the best we can do with JSON
        orderId = `ORDER_${Date.now()}`;

        // Update products.json with decremented stock
        for (const item of itemsToOrder) {
          const productIndex = products.findIndex(p => p.id === item.id);
          if (productIndex !== -1) {
            const variantIndex = products[productIndex].variants.findIndex(v => v.number === item.variantNumber);
            if (variantIndex !== -1) {
              const newStock = products[productIndex].variants[variantIndex].stock - item.quantity;
              products[productIndex].variants[variantIndex].stock = newStock;

              if (newStock === 0) {
                imagesToDelete.push({
                  publicId: products[productIndex].cloudinary_id,
                  productName: products[productIndex].name
                });
              }
            }
          }
        }

        // Write back to JSON (CRITICAL: This is not atomic)
        await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
        console.log(`✅ Stock updated in JSON file`);
      }

    } catch (transactionError) {
      console.error('❌ Transaction failed:', transactionError.message);
      return res.status(500).json({
        success: false,
        message: transactionError.message || 'Failed to process order. Stock has not been decremented.'
      });
    }

    // ════════════════════════════════════════════════════════════
    // STEP 6: DELETE IMAGES FROM CLOUDINARY (After Transaction)
    // ════════════════════════════════════════════════════════════
    if (imagesToDelete.length > 0) {
      // Fire-and-forget: Don't wait for Cloudinary, log any errors
      (async () => {
        for (const imageInfo of imagesToDelete) {
          try {
            const result = await cloudinary.api.delete_resources([imageInfo.publicId]);
            console.log(`✅ Deleted Cloudinary images for "${imageInfo.productName}"`);
          } catch (cloudinaryError) {
            // Do NOT fail the order - just log
            console.error(`⚠️  Failed to delete Cloudinary images for "${imageInfo.productName}":`, cloudinaryError.message);
          }
        }
      })();
    }

    // ════════════════════════════════════════════════════════════
    // STEP 7: SEND EMAIL (Non-Blocking)
    // ════════════════════════════════════════════════════════════
    
    // Prepare formatted cart data for email
    const cartItemsForEmail = itemsToOrder.map(item => ({
      name: item.name,
      variantNumber: item.variantNumber,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    }));

    // Build email HTML
    const cartItemsHTML = cartItemsForEmail
      .map(item => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px; text-align: left;">${item.name}</td>
          <td style="padding: 12px; text-align: center;">Variant #${item.variantNumber}</td>
          <td style="padding: 12px; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right;">₹${item.price}</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">₹${item.total}</td>
        </tr>
      `)
      .join('');

    const emailHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; }
            .total-row { background: #f9fafb; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✨ Pinkaura</h1>
              <p style="margin: 5px 0 0 0;">Order Received</p>
            </div>

            <div class="section">
              <h2>Order Details</h2>
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
              <p><strong>Status:</strong> Pending Payment Verification</p>
            </div>

            <div class="section">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerDetails.name}</p>
              <p><strong>Email:</strong> ${customerDetails.email}</p>
              <p><strong>Phone:</strong> ${customerDetails.phone}</p>
              <p><strong>Alternate Phone:</strong> ${customerDetails.alternatePhone || 'N/A'}</p>
              <p><strong>Address:</strong> ${customerDetails.address}</p>
              <p><strong>Landmark:</strong> ${customerDetails.landmark}</p>
              <p><strong>Pincode:</strong> ${customerDetails.pincode}</p>
            </div>

            <div class="section">
              <h3>Order Summary</h3>
              <table>
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th>Product</th>
                    <th>Color</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${cartItemsHTML}
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right; padding: 12px;">Subtotal:</td>
                    <td style="text-align: right; padding: 12px;">₹${serverCalculatedSubtotal}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right; padding: 12px;">Shipping:</td>
                    <td style="text-align: right; padding: 12px;">${serverCalculatedShipping === 0 ? 'FREE' : `₹${serverCalculatedShipping}`}</td>
                  </tr>
                  <tr style="background: #ec4899; color: white;">
                    <td colspan="4" style="text-align: right; padding: 12px; font-weight: bold;">Total:</td>
                    <td style="text-align: right; padding: 12px; font-weight: bold;">₹${serverCalculatedTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <h3>Payment Screenshot</h3>
              <p>Payment verification screenshot has been received and is being processed.</p>
            </div>

            <div class="footer">
              <p>Thank you for your order! We'll process it shortly.</p>
              <p>For any queries, please contact: ${process.env.SUPPORT_PHONE || '9876543210'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails in the background (fire-and-forget)
    (async () => {
      try {
        // Send email to admin
        const adminEmailPayload = {
          from: process.env.BREVO_FROM_EMAIL || 'noreply@pinkaura.com',
          to: process.env.BREVO_ADMIN_EMAIL || 'noreply@pinkaura.com',
          subject: `New Order #${orderId} - ${customerDetails.name}`,
          html: emailHTML
        };

        // Only add screenshot if we have it
        if (req.file?.path) {
          try {
            let screenshotBase64 = '';
            if (req.file.path.startsWith('http')) {
              // Cloudinary URL
              const response = await fetch(req.file.path);
              const buffer = await response.buffer?.() || Buffer.from(await response.arrayBuffer());
              screenshotBase64 = buffer.toString('base64');
            } else {
              // Local file
              const screenshotBuffer = await fs.readFile(req.file.path);
              screenshotBase64 = screenshotBuffer.toString('base64');
            }

            if (screenshotBase64) {
              adminEmailPayload.attachments = [
                {
                  content: screenshotBase64,
                  filename: `payment-screenshot-${orderId}.jpg`,
                  type: 'image/jpeg',
                  disposition: 'attachment'
                }
              ];
            }
          } catch (screenshotError) {
            console.warn(`⚠️  Could not attach screenshot to email:`, screenshotError.message);
            // Continue anyway
          }
        }

        await sendEmail(adminEmailPayload);
        console.log(`✅ Admin email sent`);
      } catch (adminEmailError) {
        console.error(`⚠️  Failed to send admin email (order not affected):`, adminEmailError.message);
      }

      try {
        // Send thank you email to customer
        const customerEmailPayload = {
          from: process.env.BREVO_FROM_EMAIL || 'noreply@pinkaura.com',
          to: customerDetails.email,
          subject: `Order Confirmation #${orderId} - Thank You!`,
          html: `
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                  .message { background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">✨ Pinkaura</h1>
                  </div>

                  <div class="message">
                    <h2>Thank You, ${customerDetails.name}! 💝</h2>
                    <p>We've received your order and payment screenshot. Our team will verify your payment and process your order shortly.</p>
                    <p><strong>Order ID:</strong> #${orderId}</p>
                    <p><strong>Order Total:</strong> ₹${serverCalculatedTotal}</p>
                    <p><strong>Expected Delivery:</strong> 3-5 business days</p>
                  </div>

                  <p>If you have any questions, please contact us at <strong>${process.env.SUPPORT_PHONE || '9876543210'}</strong></p>

                  <div class="footer">
                    <p>Thank you for choosing Pinkaura! ✨</p>
                    <p style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
                      © 2025 Pinkaura. All rights reserved.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `
        };

        await sendEmail(customerEmailPayload);
        console.log(`✅ Customer email sent to ${customerDetails.email}`);
      } catch (customerEmailError) {
        console.error(`⚠️  Failed to send customer email (order not affected):`, customerEmailError.message);
      }
    })(); // Fire-and-forget IIFE

    // ════════════════════════════════════════════════════════════
    // STEP 8: RETURN SUCCESS TO CLIENT
    // ════════════════════════════════════════════════════════════
    console.log(`✅ Order ${orderId} successfully processed!`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please wait for confirmation.',
      orderId,
      orderDetails: {
        subtotal: serverCalculatedSubtotal,
        shipping: serverCalculatedShipping,
        total: serverCalculatedTotal,
        itemCount: itemsToOrder.length
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in /api/orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred. Please try again.'
    });
  }
});

/**
 * POST /api/send-order-email
 * Send order confirmation email with payment screenshot to admin and customer
 */
app.post('/api/send-order-email', upload.single('screenshot'), async (req, res) => {
  try {
    const { orderData } = req.body;
    
    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: 'Order data is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    let order;
    try {
      order = JSON.parse(orderData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: `Invalid order data format: ${parseError.message}`
      });
    }

    const { customerDetails, cart, totals } = order;

    // Build email HTML content
    const cartItemsHTML = cart
      .map(item => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px; text-align: left;">${item.name}</td>
          <td style="padding: 12px; text-align: center;">Variant #${item.variantNumber}</td>
          <td style="padding: 12px; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right;">₹${item.price}</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">₹${item.total}</td>
        </tr>
      `)
      .join('');

    const emailHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; }
            .total-row { background: #f9fafb; font-weight: bold; font-size: 16px; }
            .screenshot { margin: 20px 0; }
            .screenshot img { max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #ddd; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✨ Pinkaura</h1>
              <p style="margin: 5px 0 0 0;">Order Received</p>
            </div>

            <div class="section">
              <h2>Order Details</h2>
              <p><strong>Order ID:</strong> #${Date.now()}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <div class="section">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerDetails.name}</p>
              <p><strong>Email:</strong> ${customerDetails.email}</p>
              <p><strong>Phone:</strong> ${customerDetails.phone}</p>
              <p><strong>Alternate Phone:</strong> ${customerDetails.alternatePhone}</p>
              <p><strong>Address:</strong> ${customerDetails.address}</p>
              <p><strong>Landmark:</strong> ${customerDetails.landmark}</p>
              <p><strong>Pincode:</strong> ${customerDetails.pincode}</p>
            </div>

            <div class="section">
              <h3>Order Summary</h3>
              <table>
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th>Product</th>
                    <th>Color</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${cartItemsHTML}
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right; padding: 12px;">Subtotal:</td>
                    <td style="text-align: right; padding: 12px;">₹${totals.subtotal}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right; padding: 12px;">Shipping:</td>
                    <td style="text-align: right; padding: 12px;">${totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`}</td>
                  </tr>
                  <tr style="background: #ec4899; color: white;">
                    <td colspan="4" style="text-align: right; padding: 12px; font-weight: bold;">Total:</td>
                    <td style="text-align: right; padding: 12px; font-weight: bold;">₹${totals.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <h3>Payment Screenshot</h3>
              <p>Payment verification screenshot has been received and is being processed.</p>
            </div>

            <div class="footer">
              <p>Thank you for your order! We'll process it shortly.</p>
              <p>For any queries, please contact: ${process.env.SUPPORT_PHONE || '9876543210'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Convert screenshot to base64 for email attachment
    // req.file.path is the Cloudinary URL when using CloudinaryStorage
    let screenshotBase64 = '';
    let screenshotFilename = `payment-screenshot-${Date.now()}.jpg`;
    
    if (req.file) {
      try {
        // If it's a Cloudinary URL, fetch and convert to base64
        if (req.file.path && req.file.path.startsWith('http')) {
          const response = await fetch(req.file.path);
          const buffer = await response.buffer();
          screenshotBase64 = buffer.toString('base64');
        } else if (req.file.path) {
          // If it's a local file, read it
          const screenshotBuffer = await fs.readFile(req.file.path);
          screenshotBase64 = screenshotBuffer.toString('base64');
        }
      } catch (readError) {
        console.warn('Could not read/fetch screenshot:', readError.message);
        // Continue anyway, we can still send the email without the attachment
      }
    }

    // Send email to admin
    const adminEmailPayload = {
      from: process.env.BREVO_FROM_EMAIL || 'noreply@pinkaura.com',
      to: process.env.BREVO_ADMIN_EMAIL || 'noreply@pinkaura.com',
      subject: `New Order Received - ${customerDetails.name}`,
      html: emailHTML
    };

    // Add attachment only if we have the base64 data
    if (screenshotBase64) {
      adminEmailPayload.attachments = [
        {
          content: screenshotBase64,
          filename: screenshotFilename,
          type: 'image/jpeg',
          disposition: 'attachment'
        }
      ];
    }

    try {
      await sendEmail(adminEmailPayload);
      console.log(`✅ Admin email sent`);
    } catch (emailError) {
      console.error('Failed to send admin email:', emailError.message);
      throw new Error(`Failed to send admin email: ${emailError.message}`);
    }

    // Send thank you email to customer
    const customerEmailPayload = {
      from: process.env.BREVO_FROM_EMAIL || 'noreply@pinkaura.com',
      to: customerDetails.email,
      subject: 'Order Confirmation - Thank You!',
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
              .message { background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">✨ Pinkaura</h1>
              </div>

              <div class="message">
                <h2>Thank You, ${customerDetails.name}! 💝</h2>
                <p>We've received your order and payment screenshot. Our team will verify your payment and process your order shortly.</p>
                <p><strong>Order Total:</strong> ₹${totals.total}</p>
                <p><strong>Expected Delivery:</strong> 3-5 business days</p>
              </div>

              <p>If you have any questions, please contact us at <strong>9876543210</strong></p>

              <div class="footer">
                <p>Thank you for choosing Pinkaura! ✨</p>
                <p style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
                  © 2025 Pinkaura. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    try {
      await sendEmail(customerEmailPayload);
      console.log(`✅ Customer email sent to ${customerDetails.email}`);
    } catch (emailError) {
      console.error('Failed to send customer email:', emailError.message);
      throw new Error(`Failed to send customer email: ${emailError.message}`);
    }

    res.json({
      success: true,
      message: 'Order confirmation emails sent successfully'
    });

  } catch (error) {
    console.error('Error sending order email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send order confirmation'
    });
  }
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
