import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { products, productsSection, supplyLabel, type EnquiryOption, type Product } from '../content'

interface Props {
  onEnquire: (option: EnquiryOption, note?: string) => void
}

function SupplyTag({ product }: { product: Product }) {
  const made = product.supply === 'manufactured'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
        made ? 'bg-accent/10 text-navy-800' : 'bg-navy-900/[0.06] text-navy-800'
      }`}
    >
      {supplyLabel[product.supply]}
    </span>
  )
}

function ProductDialog({
  product,
  onClose,
  onEnquire,
}: {
  product: Product | null
  onClose: () => void
  onEnquire: Props['onEnquire']
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (product && !d.open) d.showModal()
    if (!product && d.open) d.close()
  }, [product])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="product-dialog-title"
      className="product-dialog m-auto w-[min(92vw,760px)] rounded-xl p-0 shadow-2xl backdrop:bg-navy-950/70"
    >
      {product && (
        <div className="grid sm:grid-cols-[1fr_1.1fr]">
          <div className="flex items-center justify-center bg-mist p-8">
            <img src={product.image} alt={product.alt} className="max-h-[260px] w-auto object-contain" />
          </div>
          <div className="relative p-7">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-mist hover:text-navy-900"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <SupplyTag product={product} />
            <h3 id="product-dialog-title" className="mt-3 pr-8 text-xl font-extrabold text-navy-900">
              {product.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{product.summary}</p>
            {product.includes.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-ink">
                {product.includes.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cta" aria-hidden="true" />
                    {i}
                  </li>
                ))}
              </ul>
            )}
            {productsSection.detailNote && (
              <p className="mt-5 rounded-md bg-mist px-3.5 py-3 text-[13px] leading-relaxed text-muted">
                {productsSection.detailNote}
              </p>
            )}
            <button
              type="button"
              className="btn-cta mt-6 w-full sm:w-auto"
              onClick={() => {
                onEnquire(product.enquiry, product.title)
                onClose()
              }}
            >
              Enquire about this product <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}

export function Products({ onEnquire }: Props) {
  const [active, setActive] = useState<Product | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const published = products.filter(p => p.featured || p.fullRange)
  const categories = [...new Set(published.map(p => p.enquiry))].sort()
  const filtering = query.trim() !== '' || category !== 'all'
  const visible = published.filter(p =>
    (showAll || filtering || p.featured) &&
    (category === 'all' || p.enquiry === category) &&
    `${p.title} ${p.summary} ${p.includes.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <section id="products" aria-labelledby="products-title" className="bg-mist py-16 sm:py-20">
      <div className="container-x">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="products-title" className="h2">
              {productsSection.heading}
            </h2>
            <p className="mt-3 text-[15px] text-muted">
              {productsSection.intro}
            </p>
          </div>
          <button
            type="button"
            className="btn-outline self-start px-5 py-2.5 text-[13px] sm:self-auto"
            aria-expanded={showAll}
            aria-controls="product-grid"
            onClick={() => setShowAll((s) => !s)}
          >
            {showAll ? 'Featured products' : 'View All Products'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 rounded-xl bg-white p-4 sm:grid-cols-[1fr_280px] sm:p-5">
          <label className="block text-sm font-semibold text-navy-900">
            Search products
            <span className="relative mt-2 block"><Search className="absolute top-3 left-3 size-5 text-muted" aria-hidden="true" /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or requirement" className="field pl-10" /></span>
          </label>
          <label className="block text-sm font-semibold text-navy-900">Product category
            <select aria-label="Product category" value={category} onChange={e => setCategory(e.target.value)} className="field mt-2"><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-muted">{visible.length} {visible.length === 1 ? 'product' : 'products'}{!showAll && !filtering ? ' featured' : ' found'}</p>
          {filtering && <button type="button" onClick={() => { setQuery(''); setCategory('all') }} className="text-sm font-bold text-navy-800 underline underline-offset-4">Clear filters</button>}
        </div>
        <ul id="product-grid" className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setActive(p)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_40px_-20px_rgba(8,38,74,0.45)]"
              >
                <span className="block aspect-[4/3] overflow-hidden bg-white p-8">
                  <img
                    src={p.image}
                    alt={p.alt}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.05]"
                  />
                </span>
                <span className="flex flex-1 flex-col gap-3 border-t border-line p-6">
                  <span className="text-lg leading-snug font-bold text-navy-900">{p.title}</span>
                  <SupplyTag product={p} />
                  <span className="line-clamp-2 text-sm leading-relaxed text-muted">{p.summary}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-bold text-navy-800">
                    View details
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {visible.length === 0 && <div className="py-12 text-center"><h3 className="text-lg font-bold text-navy-900">No matching products</h3><p className="mt-2 text-muted">Try another search or choose a different category.</p><button type="button" className="btn-outline mt-5" onClick={() => { setQuery(''); setCategory('all'); setShowAll(true) }}>Show all products</button></div>}

      </div>

      <ProductDialog product={active} onClose={() => setActive(null)} onEnquire={onEnquire} />
    </section>
  )
}
