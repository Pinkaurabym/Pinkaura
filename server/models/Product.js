import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Rings', 'Necklaces', 'Earrings', 'Bracelets']
  },
  description: {
    type: String,
    default: ''
  },
  trending: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  variants: [
    {
      color: {
        type: String,
        required: true
      },
      images: [
        {
          type: String,
          required: true
        }
      ],
      stock: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
