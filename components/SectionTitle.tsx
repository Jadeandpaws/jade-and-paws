import { PawPrint } from 'lucide-react';
export function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="mx-auto mb-12 max-w-2xl text-center"><div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[.18em] text-olive"><PawPrint size={15}/>{eyebrow}</div><h2 className="font-display text-4xl leading-tight text-brown sm:text-5xl">{title}</h2>{copy && <p className="mt-4 text-[15px] leading-7 text-brown/70">{copy}</p>}</div>;
}
