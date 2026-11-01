import { useEffect, useState } from 'react';
import { fallbackImage, resolveImage } from '../../utils/images';

export default function ImageWithFallback({ src, alt = '', label, seed = 1, className = '', ...rest }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  return (
    <img
      src={failed ? fallbackImage(label || alt || 'TechNest', seed) : resolveImage(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
