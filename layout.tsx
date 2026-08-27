import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jadeandpaws.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Jade & Paws | Professional Pet Sitting in Frederick, MD', template: '%s | Jade & Paws' },
  description: 'Warm, dependable in-home pet sitting, dog walks, cat care, and overnight pet sitting in Frederick, Maryland.',
  keywords: ['pet sitter Frederick MD', 'dog walker Frederick MD', 'cat sitter Frederick MD', 'overnight pet sitting Frederick MD', 'pet care Frederick Maryland'],
  alternates: { canonical: '/' },
  openGraph: { title: 'Jade & Paws | Professional Pet Sitting in Frederick, MD', description: 'Personalized, in-home care for the pets you love.', url: '/', siteName: 'Jade & Paws', locale: 'en_US', type: 'website' },
  twitter: { card: 'summary', title: 'Jade & Paws | Pet Sitting in Frederick, MD', description: 'Personalized, in-home care for the pets you love.' },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const localBusiness = { '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'Jade & Paws', description: 'Professional in-home pet sitting, dog walking, cat care, and overnight pet sitting.', email: 'jadeandpaws@gmail.com', url: siteUrl, areaServed: { '@type': 'City', name: 'Frederick', address: { '@type': 'PostalAddress', addressLocality: 'Frederick', addressRegion: 'MD', addressCountry: 'US' } }, serviceType: ['Pet Sitting', 'Dog Walking', 'Cat Sitting', 'Overnight Pet Sitting'] };
  return <html lang="en" className="scroll-smooth"><body className={`${inter.variable} ${playfair.variable}`}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />{children}</body></html>;
}
