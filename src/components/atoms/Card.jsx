/**
 * Card Component
 * Generic card container with optional shadow/glass effect
 */

const Card = ({
  children,
  variant = 'default', // default, glass, elevated
  className = '',
  onClick = null,
  ...props
}) => {
  const variants = {
    default: 'bg-white rounded-2xl shadow-md',
    glass: 'glass rounded-3xl border border-white/20',
    elevated: 'bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow',
  };

  return (
    <div
      className={`${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
