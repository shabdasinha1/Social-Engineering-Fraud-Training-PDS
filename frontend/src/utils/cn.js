/** Joins class names, ignoring falsy values. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
