import { motion } from 'framer-motion';

/**
 * Button Component
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 */

const buttonStyles = {
  base: `
    inline-flex items-center justify-center
    font-semibold rounded-full
    transition-all duration-250
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `,
  variants: {
    primary: `
      bg-pink-500 text-white
      hover:bg-pink-600
      focus:ring-pink-500
      shadow-md hover:shadow-glow-pink
    `,
    secondary: `
      bg-white text-pink-500 border-2 border-pink-500
      hover:bg-pink-50
      focus:ring-pink-500
    `,
    ghost: `
      text-pink-500 bg-transparent
      hover:bg-pink-50
      focus:ring-pink-500
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600
      focus:ring-red-500
    `,
  },
  sizes: {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  },
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${buttonStyles.base}
        ${buttonStyles.variants[variant]}
        ${buttonStyles.sizes[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;
