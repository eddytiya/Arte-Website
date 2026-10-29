import { useCallback, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { CapabilityStrip } from './components/CapabilityStrip'
import { About } from './components/About'
import { Products } from './components/Products'
import { Services } from './components/Services'
import { Industries } from './components/Industries'
import { WhyArte } from './components/WhyArte'
import { Contact, type EnquiryPreset } from './components/Contact'
import { Footer } from './components/Footer'
import type { EnquiryOption } from './content'

export default function App() {
  const [preset, setPreset] = useState<EnquiryPreset | null>(null)

  const enquire = useCallback((option: EnquiryOption, note?: string) => {
    setPreset({ option, note, key: Date.now() })
    const target = document.getElementById('enquiry')
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    // move keyboard focus to the form once scrolled
    window.setTimeout(() => target?.querySelector<HTMLElement>('input[name="fullName"]')?.focus({ preventScroll: true }), 450)
  }, [])

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <CapabilityStrip />
        <About />
        <Products onEnquire={enquire} />
        <Services onEnquire={enquire} />
        <Industries />
        <WhyArte />
        <Contact preset={preset} />
      </main>
      <Footer />
    </>
  )
}
