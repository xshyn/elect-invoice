import { forwardRef, type CSSProperties } from 'react';
import type { BusinessProfile, Invoice } from '../types';
import { grandTotal, lineTotal, subtotal, taxAmount } from '../utils/calc';
import { formatFaMoney, formatFaQty, toFaDigits } from '../utils/persian';
import { longFaDate } from '../utils/jalali';
import { totalInWords } from '../utils/words';

/** Export-only invoice paper.
 *
 *  WHY A SEPARATE COMPONENT: canvas renderers (html2canvas-pro) cannot parse
 *  Tailwind v4's modern color functions (`color-mix()`, `oklch`) and lay out
 *  CSS grid / flex-gap unreliably — the result is either a thrown error (no
 *  file at all) or displaced cells ("tangled" output). This tree therefore
 *  uses ONLY canvas-safe primitives: <table> layout, hex/rgba() colors,
 *  margins instead of gap. It is visually identical to InvoicePaper.
 *
 *  It ALWAYS renders the light theme: an exported invoice is a physical
 *  document, even when the app is in dark mode.
 */

const INK = '#111827';
const MUTED = '#4b5563';
const FAINT = '#6b7280';
const PAPER = '#ffffff';
const ZEBRA = '#f8fafc';
const BAR: Record<string, string> = {
  amber: '#fbbf24',
  teal: '#14b8a6',
  navy: '#1e293b',
  rose: '#f43f5e',
};
const BADGE_BG: Record<string, string> = {
  amber: '#fef3c7',
  teal: '#ccfbf1',
  navy: '#e2e8f0',
  rose: '#ffe4e6',
};
const BADGE_TX: Record<string, string> = {
  amber: '#78350f',
  teal: '#134e4a',
  navy: '#0f172a',
  rose: '#881337',
};

const cell: CSSProperties = { border: `1px solid ${INK}`, padding: '6px 8px' };

const InvoicePaperExport = forwardRef<HTMLDivElement, { invoice: Invoice; business: BusinessProfile }>(
  function InvoicePaperExport({ invoice, business }, ref) {
    const sub = subtotal(invoice);
    const tax = taxAmount(invoice);
    const total = grandTotal(invoice);
    const disc = invoice.discountEnabled ? Math.min(invoice.discount || 0, sub) : 0;
    const bar = BAR[business.theme] ?? BAR.amber;
    const badgeBg = BADGE_BG[business.theme] ?? BADGE_BG.amber;
    const badgeTx = BADGE_TX[business.theme] ?? BADGE_TX.amber;

    const rows = [...invoice.items];
    while (rows.length < Math.max(5, invoice.items.length))
      rows.push({ id: `blank-${rows.length}`, desc: '', qty: 0, unitPrice: 0 });

    return (
      <div ref={ref} dir="rtl" style={{ background: PAPER, color: INK, width: 800, fontSize: 13, lineHeight: 1.7 }}>
        <div style={{ height: 10, background: bar }} />

        {/* header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: `2px solid ${INK}` }}>
          <tbody>
            <tr>
              <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                <table style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: 'middle', paddingLeft: 12 }}>
                        {business.logoDataUrl ? (
                          <img src={business.logoDataUrl} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: 40 }}>⚡</span>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 26, fontWeight: 900 }}>{business.name}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>{business.tagline}</div>
                        {business.website ? <div style={{ fontSize: 11, color: FAINT }}>{business.website}</div> : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'left', fontSize: 11, width: 190 }}>
                {business.phones.map((p) => (
                  <div key={p} style={{ fontWeight: 800 }}>{toFaDigits(p)}</div>
                ))}
                <div style={{ color: MUTED, marginTop: 4 }}>{business.address}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* title */}
        <div style={{ textAlign: 'center', margin: '12px 0 10px' }}>
          <span style={{ border: `2px solid ${INK}`, borderRadius: 999, padding: '4px 34px', fontSize: 20, fontWeight: 900 }}>
            {invoice.title}
          </span>
        </div>

        {/* meta */}
        <table style={{ width: 'calc(100% - 36px)', margin: '0 18px', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ ...cell, background: ZEBRA, width: '25%' }}>
                <b style={{ color: MUTED }}>شماره: </b>
                <b>{toFaDigits(invoice.number)}</b>
              </td>
              <td style={{ ...cell, width: '25%' }}>
                <b style={{ color: MUTED }}>تاریخ: </b>
                <b>{toFaDigits(invoice.date)}</b>
              </td>
              <td style={{ ...cell, background: ZEBRA, width: '25%' }}>
                <b style={{ color: MUTED }}>خریدار: </b>
                <b>{invoice.buyerName || '—'}</b>
              </td>
              <td style={{ ...cell, width: '25%' }}>
                <b style={{ color: MUTED }}>تماس: </b>
                <b>{invoice.buyerPhone ? toFaDigits(invoice.buyerPhone) : '—'}</b>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ margin: '4px 18px 0', fontSize: 11, color: FAINT }}>تاریخ کامل: {longFaDate(invoice.date)}</div>

        {/* items */}
        <table style={{ width: 'calc(100% - 36px)', margin: '10px 18px 0', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: PAPER }}>
              <th style={{ ...cell, width: 52 }}>ردیف</th>
              <th style={cell}>شرح کالا یا خدمات</th>
              <th style={{ ...cell, width: 70 }}>تعداد</th>
              <th style={{ ...cell, width: 110 }}>قیمت واحد</th>
              <th style={{ ...cell, width: 130 }}>قیمت کل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it, i) => {
              const blank = !it.desc && !it.qty && !it.unitPrice;
              return (
                <tr key={it.id} style={i % 2 === 1 ? { background: ZEBRA } : undefined}>
                  <td style={cell}>
                    <span
                      style={{
                        display: 'inline-block', width: 26, height: 26, lineHeight: '26px',
                        borderRadius: 999, background: badgeBg, color: badgeTx, fontWeight: 900,
                      }}
                    >
                      {toFaDigits(i + 1)}
                    </span>
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>{blank ? ' ' : it.desc}</td>
                  <td style={cell}>{blank ? '' : formatFaQty(it.qty)}</td>
                  <td style={cell}>{blank ? '' : formatFaMoney(it.unitPrice)}</td>
                  <td style={{ ...cell, fontWeight: 800 }}>{blank ? '' : formatFaMoney(lineTotal(it.qty, it.unitPrice))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* totals */}
        <table style={{ width: 'calc(100% - 36px)', margin: '10px 18px 0', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ ...cell, background: ZEBRA }}>
                <b style={{ color: MUTED }}>جمع اقلام</b>
              </td>
              <td style={{ ...cell, background: ZEBRA, textAlign: 'left', fontWeight: 900 }}>
                {formatFaMoney(sub)} {invoice.currency}
              </td>
            </tr>
            {invoice.discountEnabled && disc > 0 ? (
              <tr>
                <td style={cell}><b style={{ color: MUTED }}>تخفیف</b></td>
                <td style={{ ...cell, textAlign: 'left', fontWeight: 900, color: '#be123c' }}>
                  {formatFaMoney(disc)} {invoice.currency}
                </td>
              </tr>
            ) : null}
            {invoice.taxEnabled && tax > 0 ? (
              <tr>
                <td style={{ ...cell, background: ZEBRA }}>
                  <b style={{ color: MUTED }}>ارزش افزوده ({toFaDigits(invoice.taxRate)}٪)</b>
                </td>
                <td style={{ ...cell, background: ZEBRA, textAlign: 'left', fontWeight: 900 }}>
                  {formatFaMoney(tax)} {invoice.currency}
                </td>
              </tr>
            ) : null}
            <tr>
              <td style={{ ...cell, fontWeight: 900, fontSize: 15, backgroundColor: badgeBg }}>
                جمع کل (به عدد)
              </td>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 900, fontSize: 15, backgroundColor: badgeBg }}>
                {formatFaMoney(total)} {invoice.currency}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ ...cell, lineHeight: 2 }}>
                <b style={{ color: MUTED }}>جمع کل به حروف: </b>
                <b>{totalInWords(total, business.wordsUnit || invoice.currency)}</b>
              </td>
            </tr>
            {invoice.notes ? (
              <tr>
                <td colSpan={2} style={{ ...cell, fontSize: 12, color: MUTED }}>
                  <b>توضیحات: </b>
                  {invoice.notes}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* signatures */}
        <table style={{ width: 'calc(100% - 36px)', margin: '14px 18px 0', borderCollapse: 'separate', borderSpacing: 12 }}>
          <tbody>
            <tr>
              <td style={{ border: `1px solid ${INK}`, borderRadius: 8, textAlign: 'center', padding: '8px 8px 40px', width: '50%', fontWeight: 900 }}>
                امضاء خریدار
              </td>
              <td style={{ border: `1px solid ${INK}`, borderRadius: 8, textAlign: 'center', padding: '8px 8px 40px', width: '50%', fontWeight: 900 }}>
                مهر و امضاء فروشنده
              </td>
            </tr>
          </tbody>
        </table>

        {/* footer */}
        <div style={{ marginTop: 14, borderTop: `2px solid ${INK}`, background: '#f1f5f9', textAlign: 'center', fontSize: 11, color: MUTED, padding: '10px 18px' }}>
          <div style={{ fontWeight: 800 }}>{business.address}</div>
          <div>{business.phones.map((p) => toFaDigits(p)).join(' • ')}</div>
        </div>
        <div style={{ height: 10, background: bar }} />
      </div>
    );
  },
);

export default InvoicePaperExport;
