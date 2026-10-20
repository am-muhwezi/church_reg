import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders `children` into #print-root, a sibling of the app root that is only visible when printing.
 * This keeps the admin chrome out of the PDF without fighting fixed headers and sidebars.
 * `pageCss` carries the @page rule (size/margins) for this report type.
 */
export default function PrintPortal({ children, pageCss }: { children: React.ReactNode; pageCss: string }) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'print-root'
    document.body.appendChild(el)
    setNode(el)
    return () => {
      document.body.removeChild(el)
    }
  }, [])
  if (!node) return null
  return createPortal(
    <>
      <style>{`
        #print-root { display: none; }
        @media print {
          ${pageCss}
          #root { display: none !important; }
          #print-root { display: block !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {children}
    </>,
    node,
  )
}

export const DECK_PAGE_CSS = `
  @page { size: 1440px 810px; margin: 0; }
  #print-root svg.deck-slide { width: 1440px !important; height: 810px !important; display: block; break-after: page; page-break-after: always; }
  #print-root svg.deck-slide:last-child { break-after: auto; page-break-after: auto; }
`

export const DOC_PAGE_CSS = `
  @page { size: A4 portrait; margin: 12mm; }
`

/** Chrome names the saved PDF after document.title. */
export function printAs(filename: string) {
  const prev = document.title
  document.title = filename
  const restore = () => {
    document.title = prev
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
}
