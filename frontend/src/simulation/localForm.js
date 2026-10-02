import { useCallback, useState } from 'react'
import { FIELD_KIND } from '@/simulation/sceneModel'

/**
 * The state behind a simulated page's fields, and nothing else (IMMERSIVE-003A-R2).
 *
 * Deliberately its own module rather than part of the component that draws a field, so
 * that the promise about where a typed value lives can be read in one place and checked
 * in one place:
 *
 * - it is `useState` inside the component that calls this hook, and it is never lifted,
 * - it is discarded when that component unmounts, which is what leaving the screen does,
 * - nothing here writes to storage, a cookie, an event, a log or the network, and there is
 *   no accessor that would let a caller hand a value to something that could.
 *
 * The hook returns only what a field needs to draw itself and what a page needs to decide
 * whether its own Continue control is usable. Everything else about the value stays here.
 */

/** Digits only, capped at the field's length. */
const digitsOnly = (value, max) => value.replace(/\D/g, '').slice(0, max)

/** Group a raw value for display: a group of `4` gives `1234 5678 9012 3456`. */
export function grouped(value, size) {
  if (!size) return value
  return value.replace(new RegExp(`(.{${size}})`, 'g'), '$1 ').trim()
}

/** MM/YY, built from the digits typed so far. */
export const asExpiry = (raw) => (raw.length <= 2 ? raw : `${raw.slice(0, 2)}/${raw.slice(2)}`)

/** What the field shows, which is a formatting of what was typed and never more. */
export function displayValue(field, raw) {
  switch (field.kind) {
    case FIELD_KIND.EXPIRY:
      return asExpiry(raw)
    case FIELD_KIND.DIGITS:
      return grouped(raw, field.group)
    default:
      return raw
  }
}

/**
 * How many characters a field ACCEPTS: its `max` when it declares one, otherwise its
 * `length` (`sceneModel.field()`). IMMERSIVE-003D found this capped at `length`, so a
 * name-on-card field needing 3 characters stopped taking input at 3 - the exact failure the
 * `field()` contract warns about.
 */
const capacity = (field) => field.max ?? field.length

export function normalise(field, next) {
  switch (field.kind) {
    case FIELD_KIND.DIGITS:
    case FIELD_KIND.SECRET:
    case FIELD_KIND.EXPIRY:
      return digitsOnly(next, capacity(field))
    default:
      return next.replace(/[\r\n]+/g, ' ').slice(0, capacity(field))
  }
}

/** True when every field holds as many characters as it asks for. */
export function formComplete(fields, values) {
  return fields.every((field) => (values[field.name] ?? '').length >= field.length)
}

export function useLocalForm() {
  const [values, setValues] = useState({})
  const [touched, setTouched] = useState({})

  const set = useCallback((field, next) => {
    setValues((current) => ({ ...current, [field.name]: normalise(field, next) }))
  }, [])

  const touch = useCallback((field) => {
    setTouched((current) => ({ ...current, [field.name]: true }))
  }, [])

  return { values, touched, set, touch }
}
