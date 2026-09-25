import {useRef, useState} from 'react';
import {Image} from '@shopify/hydrogen';

type GalleryImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Mobile: full-bleed horizontal swipe with a position counter.
 * Desktop: lead image, then the rest in a two-up grid (pure CSS switch).
 */
export function ProductGallery({images, title}: {images: GalleryImage[]; title: string}) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  if (!images.length) return <div className="product-gallery product-gallery-empty" />;

  return (
    <div className="product-gallery">
      <div
        className="product-gallery-track"
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((image, i) => (
          <div className="product-gallery-slide" key={image.id ?? image.url}>
            <Image
              alt={image.altText || (i === 0 ? title : '')}
              aspectRatio="4/5"
              crop="center"
              data={image}
              loading={i === 0 ? 'eager' : 'lazy'}
              sizes="(min-width: 56em) 55vw, 100vw"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="product-gallery-count" aria-hidden>
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
