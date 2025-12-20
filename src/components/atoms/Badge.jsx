import { motion } from 'framer-motion';
import { colors, borderRadius, shadows, spacing } from '../../theme';

/**
 * ⚛️ Badge Component
 * Small label for categorization, status, etc.
 * 
 * Usage:
 * <Badge variant="trending">🔥 Trending</Badge>
 * <Badge variant="bestseller">⭐ Best Seller</Badge>
 * <Badge variant="stock" size="sm">Only 5 left</Badge>
 */

const badgeStyles = {
  variants: {
    trending: {
      bg: colors.accent.mint,
      text: '#fff',
    },
    bestseller: {
      bg: colors.secondary.purple,
      text: '#fff',
    },
    stock: {
      bg: colors.primary.aura,
      text: colors.primary.pink,
    },
    category: {
      bg: colors.neutral.dark100,
      text: colors.neutral.dark900,
    },
    success: {
      bg: colors.semantic.success,
      text: '#fff',
    },
    warning: {
      bg: colors.semantic.warning,
      text: '#fff',
    },
    error: {
      bg: colors.semantic.error,
      text: '#fff',
    },
  },
  sizes: {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  },
};

const Badge = ({
  children,
  variant = 'category',
  size = 'md',
  animated = false,
  className = '',
  ...props
}) => {
  const style = badgeStyles.variants[variant];
  
  const badge = (
    <div
      className={`
        inline-block font-semibold rounded-full
        ${badgeStyles.sizes[size]}
        ${className}
      `}
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
      {...props}
    >
      {children}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.4 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
};

export default Badge;
