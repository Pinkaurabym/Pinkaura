import { colors, spacing } from '../../theme';

/**
 * ⚛️ ImageWrapper Component
 * Handles image loading, lazy loading, placeholders
 * 
 * Usage:
 * <ImageWrapper src="..." alt="..." ratio="square" />
 * <ImageWrapper src="..." lazyLoad />
 */

const ImageWrapper = ({
  src,
  alt = 'Image',
  ratio = 'square', // square, video, portrait
  lazyLoad = false,
  className = '',
  containerClassName = '',
  onLoad = null,
  ...props
}) => {
  const ratioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[2/1]',
  };

  return (
    <div
      className={`
        relative w-full overflow-hidden
        ${ratioClasses[ratio]}
        bg-neutral-100
        ${containerClassName}
      `}
    >
      {/* Skeleton loader */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />

      {/* Image */}
      <img
        src={src}
        alt={alt}
        loading={lazyLoad ? 'lazy' : 'eager'}
        onLoad={(e) => {
          // Remove skeleton when loaded
          e.target.parentElement.querySelector('.skeleton')?.remove?.();
          onLoad?.(e);
        }}
        className={`
          w-full h-full object-cover
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export default ImageWrapper;
