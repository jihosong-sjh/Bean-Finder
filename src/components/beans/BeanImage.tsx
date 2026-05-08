import { useEffect, useState } from 'react';

type BeanImageProps = {
  src: string | null;
  alt: string;
  fallbackLabel: string;
  className: string;
};

export function BeanImage({
  src,
  alt,
  fallbackLabel,
  className,
}: BeanImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasUsableImage = Boolean(src && src !== failedSrc);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  return (
    <div className={className}>
      {hasUsableImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="bean-image-fallback" role="img" aria-label={alt}>
          <span aria-hidden="true">{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}
