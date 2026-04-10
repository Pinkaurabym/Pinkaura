const shimmerStyle = {
  backgroundImage:
    'linear-gradient(90deg, #FCF0F8 0%, #F9D9E8 40%, #FCF0F8 80%)',
  backgroundSize: '2000px 100%',
};

const ProductCardSkeleton = () => (
  <div className="product-card overflow-hidden">
    {/* Image placeholder */}
    <div
      className="h-64 w-full animate-shimmer"
      style={shimmerStyle}
    />

    {/* Info placeholder */}
    <div className="p-4 space-y-3">
      <div
        className="h-4 rounded-full w-3/4 animate-shimmer"
        style={shimmerStyle}
      />
      <div
        className="h-4 rounded-full w-1/2 animate-shimmer"
        style={shimmerStyle}
      />
      <div
        className="h-6 rounded-full w-1/3 mt-2 animate-shimmer"
        style={{ ...shimmerStyle, backgroundImage: 'linear-gradient(90deg, #F9D9E8 0%, #F5B8D1 40%, #F9D9E8 80%)' }}
      />
    </div>
  </div>
);

export default ProductCardSkeleton;
