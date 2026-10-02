import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Lock, LogIn, ShieldCheck, User } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'

/**
 * Administrator sign-in.
 *
 * Deliberately plain and separate from the candidate AuthLayout, which is
 * branded for the training journey. There is no registration link and no
 * password-reset link, because neither exists: the account is created once by
 * the operator with `npm run admin:create`.
 */
export function AdminLoginPage() {
  useDocumentTitle('Administrator Sign In')

  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)
  const [submitError, setSubmitError] = useState('')

  // Already signed in - skip the form.
  useEffect(() => {
    const controller = new AbortController()

    adminApi
      .me({ signal: controller.signal })
      .then(() => navigate(ROUTES.ADMIN, { replace: true }))
      .catch((error) => {
        if (error.name !== 'AbortError') setChecking(false)
      })

    return () => controller.abort()
  }, [navigate])

  const handleChange = (field) => (event) => {
    const { value } = event.target
    setForm((previous) => ({ ...previous, [field]: value }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.username.trim() || !form.password) {
      setSubmitError('Enter both a username and a password.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      await adminApi.signIn(form.username.trim(), form.password)
      navigate(ROUTES.ADMIN, { replace: true })
    } catch (error) {
      // The server returns one generic message for a wrong username and a
      // wrong password alike. It is shown as-is rather than interpreted here.
      setSubmitError(error.message)
      setForm((previous) => ({ ...previous, password: '' }))
      setSubmitting(false)
    }
  }

  if (checking) return null

  return (
    <main className="flex min-h-dvh items-center justify-center py-10 console-grid">
      <PageContainer size="sm" className="max-w-md">
        <p className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-signal">
          <span aria-hidden="true" className="h-px w-6 bg-signal" />
          Instructor console
          <span aria-hidden="true" className="h-px w-6 bg-signal" />
        </p>
        <Card className="relative animate-fade-up overflow-hidden rounded-xl">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-console" />
          <header className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-console text-console-accent">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Administrator Sign In</h1>
              <p className="mt-1 text-sm text-balance-pretty text-text-muted">
                Statistics and reporting access. This is not the candidate sign-in.
              </p>
            </div>
          </header>

          {submitError && (
            <Alert variant="danger" className="mt-5">
              {submitError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <FormField id="admin-username" label="Username" required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  name="username"
                  icon={User}
                  value={form.username}
                  onChange={handleChange('username')}
                  aria-describedby={describedBy}
                  placeholder="Enter your administrator username"
                  autoComplete="username"
                  autoFocus
                  maxLength={32}
                  enterKeyHint="next"
                />
              )}
            </FormField>

            <FormField id="admin-password" label="Password" required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  name="password"
                  type="password"
                  icon={KeyRound}
                  value={form.password}
                  onChange={handleChange('password')}
                  aria-describedby={describedBy}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  enterKeyHint="go"
                />
              )}
            </FormField>

            <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
              {!submitting && <LogIn size={19} aria-hidden="true" />}
              Sign In
            </Button>
          </form>

          <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-sm text-text-muted">
            <Lock size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            The administrator account is created on the server by the operator. There is no
            self-registration and no password reset.
          </p>
        </Card>
      </PageContainer>
    </main>
  )
}
