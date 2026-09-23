'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const ROTATE_MS = 5000;

const photos = [
  { src: '/pets/athena-1.jpg', alt: 'Athena, cared for by Jade & Paws', position: '50% 30%' },
  { src: '/pets/kora-1.jpg', alt: 'Kora, cared for by Jade & Paws', position: '50% 25%' },
  { src: '/pets/lola-1.jpg', alt: 'Lola, cared for by Jade & Paws', position: '50% 20%' },
  { src: '/pets/luna-1.jpg', alt: 'Luna, cared for by Jade & Paws', position: '50% 30%' },
  { src: '/pets/pippy-1.jpg', alt: 'Pippy, cared for by Jade & Paws', position: '65% 40%' },
  { src: '/pets/stella-1.jpg', alt: "Stella, Jade's own cat", position: '35% 60%' },
  { src: '/pets/leo-1.jpg', alt: "Leo, Jade's own cat", position: '35% 55%' },
] as const;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % photos.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative size-full">
      {photos.map((photo, i) => (
        <Image
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          fill
          priority={i === 0}
          sizes="(min-width: 1024px) 560px, 90vw"
          className="object-cover transition-opacity duration-[900ms] ease-in-out"
          style={{ objectPosition: photo.position, opacity: i === index ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
