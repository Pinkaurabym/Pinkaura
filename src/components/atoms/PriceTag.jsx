import { colors } from '../../theme';

/**
 * ⚛️ PriceTag Component
 * Displays price in INR format
 * Can show sale price vs original price
 * 
 * Usage:
 * <PriceTag price={250} />
 * <PriceTag price={250} originalPrice={400} />
 * <PriceTag price={250} size="lg" showCurrency />
 */

const PriceTag = ({
  price,
  originalPrice = null,
  size = 'md',
  showCurrency = true,
  className = '',
  isSale = originalPrice !== null,
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const discountPercent = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={`flex items-baseline gap-3 ${className}`}>
      {/* Current Price */}
      <span
        className={`font-bold ${sizeClasses[size]}`}
        style={{ color: colors.primary.pink }}
      >
        {showCurrency ? '₹' : ''}
        {price.toLocaleString('en-IN')}
      </span>

      {/* Original Price (Strikethrough) */}
      {originalPrice && (
        <span className="text-sm text-gray-500 line-through">
          ₹{originalPrice.toLocaleString('en-IN')}
        </span>
      )}

      {/* Discount Badge */}
      {isSale && discountPercent > 0 && (
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{
            backgroundColor: colors.semantic.success,
            color: 'white',
          }}
        >
          -{discountPercent}%
        </span>
      )}
    </div>
  );
};

export default PriceTag;
