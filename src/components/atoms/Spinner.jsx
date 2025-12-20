/**
 * ⚛️ Spinner Component
 * Loading indicator
 */

const Spinner = ({ size = 'md', color = '#EE5B8F' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizes[size]} border-4 rounded-full animate-spin`}
      style={{
        borderColor: `${color}20`,
        borderTopColor: color,
      }}
    />
  );
};

export default Spinner;
