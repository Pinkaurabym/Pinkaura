# 🌸 Pinkaura - Modern E-commerce React App

A stunning, modern e-commerce platform built with **React**, **Vite**, **Tailwind CSS**, and **Framer Motion** featuring glassmorphism, smooth animations, and an elegant "Pink Aura" aesthetic.

Built with **Clean Architecture** principles: atomic components, business logic in hooks, centralized design system, zero bloat.

## ✨ Key Features

- **⚛️ Clean Architecture**: Atomic components, business logic in hooks, separation of concerns
- **🎨 Centralized Design System**: All colors, typography, spacing defined in one place - NO hardcoding
- **✨ Smooth Animations**: Delightful micro-interactions powered by Framer Motion
- **🛍️ Complete E-commerce**: Product browsing, variants, cart, checkout
- **💾 Persistent State**: Cart data synced with localStorage
- **📱 Fully Responsive**: Mobile-first design
- **🔍 Advanced Filtering**: Category, search, sort, price range
- **⚡ Performance**: Vite for fast dev server, lazy loading, code splitting

## 🏗️ Architecture

### Component Hierarchy
```
Atoms (Buttons, Badges, Cards)
  ↓
Molecules (ProductCard, QuantityControl, CartItemCard)
  ↓
Organisms (Navbar, ProductGrid, CartDrawer)
  ↓
Pages (HomePage, ProductPage, BagPage)
```

### Business Logic
All business logic is extracted into **custom hooks** - components stay pure and presentational.

```javascript
// Components use hooks for logic
const { items, addItem, removeItem, total } = useCart();
const { products, loading } = useProducts();
const { filtered, setCategory } = useFilters(products);
```

### Design System
All design tokens (colors, spacing, typography) are centralized in `/src/theme/` - use them everywhere, hardcode nothing.

```javascript
import { colors, spacing, shadows } from '@/theme';

<button style={{ backgroundColor: colors.primary.pink }}>
  Add to Cart
</button>
```

## 📁 Project Structure

```
src/
├── components/
│   ├── atoms/           # Smallest UI units (Button, Badge, PriceTag)
│   ├── molecules/       # Combinations (ProductCard, QuantityControl)
│   ├── organisms/       # Sections (Navbar, CartDrawer, ProductGrid)
│   └── layouts/         # Page layouts
├── hooks/               # Business logic (useCart, useProducts, useFilters)
├── pages/               # Route pages (HomePage, ProductPage, BagPage)
├── store/               # Global state (Zustand)
├── services/            # API calls and data services
├── theme/               # Design tokens (colors, typography, spacing)
├── utils/               # Helpers (formatters, validators, constants)
├── App.jsx
└── main.jsx
```

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed structure**

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start dev server (auto-opens browser)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Design System

### Colors
All colors defined in `src/theme/colors.js`:
- **Primary Pink**: `#EE5B8F` (main brand color)
- **Secondary Purple**: `#A855F7` (complementary)
- **Accent Mint**: `#0FE5A8` (success/highlights)

### Typography
- **Headings**: Playfair Display (serif, elegant)
- **Body**: Poppins (sans-serif, modern)

### Spacing
8px-based grid system for consistent padding/margins.

**Never hardcode colors or spacing** - use the theme system!

## 🪝 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useCart()` | Manage shopping cart |
| `useProducts()` | Fetch & cache products |
| `useFilters()` | Category, sort, price filtering |
| `useModal()` | Modal state management |
| `useNotification()` | Toast notifications |
| `useLocalStorage()` | Persistent storage |

## 🛒 Cart Management

```javascript
import { useCart } from '@/hooks/useCart';

const MyComponent = () => {
  const { 
    items,        // Cart items
    addItem,      // Add product
    removeItem,   // Remove product
    updateQuantity, // Change qty
    total,        // Total price
    itemCount,    // Total items
  } = useCart();
};
```

## 📦 Tech Stack

| Tech | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router | Routing |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Zustand | State management |

## 🗑️ Cleaning Up (Removing Legacy Code)

As the React migration is complete, delete these legacy files:

```bash
# OLD HTML files (replaced by React Router)
rm index.html product.html bag.html checkout.html

# OLD JS files (replaced by hooks)
rm -rf js/ api/ css/
```

**See [CLEANUP_CHECKLIST.md](./CLEANUP_CHECKLIST.md) for detailed guide**

## 💡 Development Workflow

### Adding a New Feature

1. **Create Hook** (business logic)
   ```javascript
   // src/hooks/useNewFeature.js
   export const useNewFeature = () => { ... };
   ```

2. **Create Components** (UI)
   ```javascript
   // src/components/atoms/NewAtom.jsx
   const NewAtom = ({ prop }) => { ... };
   ```

3. **Compose in Organism**
   ```javascript
   // src/components/organisms/NewOrganism.jsx
   const NewOrganism = () => {
     const { state } = useNewFeature();
     return <NewAtom prop={state} />;
   };
   ```

4. **Use in Page**
   ```javascript
   // src/pages/SomePage.jsx
   return <NewOrganism />;
   ```

### Code Quality

Follow these DRY principles:
- ✅ Reusable atomic components
- ✅ Business logic in hooks
- ✅ Design tokens from theme
- ✅ Utilities for common operations
- ✅ No code duplication

**See [CLEAN_ARCHITECTURE_GUIDE.md](./CLEAN_ARCHITECTURE_GUIDE.md) for detailed practices**

## 🎯 Component Examples

### Button (Atom)
```jsx
<Button 
  variant="primary"
  size="lg"
  onClick={handleClick}
  isLoading={loading}
>
  Add to Cart
</Button>
```

### ProductCard (Molecule)
```jsx
<ProductCard 
  product={product}
  variant={product.variants[0]}
  onClick={() => navigate(`/product/${product.id}`)}
/>
```

### ProductGrid (Organism)
```jsx
<ProductGrid 
  products={products}
  loading={loading}
  onAddClick={handleAdd}
/>
```

## 🚀 Deployment

### Build
```bash
npm run build
# Creates optimized dist/ folder
```

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🧪 Testing

Each layer is designed to be testable:

**Atoms**: Test rendering with different props
**Hooks**: Test logic with renderHook()
**Pages**: Integration tests with component tree

## 📊 Performance

- ⚡ Vite dev server: 100ms startup
- 📦 Code splitting per route
- 🖼️ Lazy loading images
- 🎬 GPU-accelerated animations
- 💾 Zustand for lightweight state

## 🛡️ Best Practices

```jsx
// ✅ DO
import Button from '@/components/atoms/Button';
import { useCart } from '@/hooks/useCart';
import { colors } from '@/theme';
import { formatPrice } from '@/utils';

// ❌ DON'T
import Button from './components/Button';  // Use absolute imports
const color = '#EE5B8F';  // Hardcode colors
const cartLogic = () => { ... };  // Put logic in components
```

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Folder structure & design
- [CLEAN_ARCHITECTURE_GUIDE.md](./CLEAN_ARCHITECTURE_GUIDE.md) - How to build features
- [CLEANUP_CHECKLIST.md](./CLEANUP_CHECKLIST.md) - Delete legacy files

## 🤝 Contributing

1. Follow the atomic component structure
2. Put business logic in hooks
3. Use theme tokens, never hardcode
4. Keep components under 150 lines
5. Add JSDoc comments
6. Test before committing

## 👨‍💻 Developer

Built with ✨ by [Zayeem Zaki](https://www.linkedin.com/in/zayeem-zaki/)

## 📄 License

ISC License - See LICENSE file for details

---

**Ready to scale?** Follow the clean architecture principles and watch your codebase stay maintainable! 🚀✨

