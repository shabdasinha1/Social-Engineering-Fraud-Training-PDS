/**
 * Non-component helpers shared by the instructor screens (ENHANCEMENT-001B). Kept apart
 * from AdminPrimitives.jsx so that file exports components only.
 */

/** The entrance every page section uses: fade and a 6px rise, motion-safe only. */
export const enter = 'motion-safe:animate-admin-enter stagger'

/** Staggers sibling entrances by 45ms each (see the `stagger` utility in index.css). */
export const staggerStyle = (index) => ({ '--stagger': index })

/** The class for a table row: a quiet hover and no border under the last one. */
export const rowClass = 'group/row hover:bg-secondary-soft/50 [&:last-child>td]:border-b-0'

/**
 * Which page numbers to show: every page up to seven, otherwise the first, the last, the
 * current page and its neighbours, with `gap` markers where pages are skipped.
 */
export function pageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, 'gap-end', totalPages]
  if (page >= totalPages - 3) {
    return [1, 'gap-start', ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)]
  }
  return [1, 'gap-start', page - 1, page, page + 1, 'gap-end', totalPages]
}
