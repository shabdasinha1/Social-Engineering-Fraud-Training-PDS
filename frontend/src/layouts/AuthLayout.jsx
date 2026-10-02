import { ClipboardCheck, Eye, MessageSquare } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { ChannelFeed, EntryBackdrop, OrbitRings } from '@/components/auth/EntryVisuals'
import { ASSESSMENT_SCENARIO_COUNT } from '@/constants/app'

const STEPS = [
  {
    icon: Eye,
    title: 'See real-looking messages',
    text: `You will be shown ${ASSESSMENT_SCENARIO_COUNT} messages from WhatsApp, Instagram, SMS and Email.`,
  },
  {
    icon: MessageSquare,
    title: 'Decide what you would do',
    text: 'Say whether each message is safe or a fraud, and choose your action.',
  },
  {
    icon: ClipboardCheck,
    title: 'Get your score and feedback',
    text: 'At the end you receive your score and simple advice in plain language.',
  },
]

/**
 * Entrance order for the introduction column, in 70ms steps. The delay only matters to
 * the `motion-safe:animate-entry-rise` each element carries; with reduced motion there is
 * no animation for it to delay.
 */
const rise = (step) => ({ style: { animationDelay: `${step * 70}ms` } })

/**
 * Entry layout for the learner login screen - the "assessment terminal" composition of
 * ENHANCEMENT-002.
 *
 * Desktop (lg+): the introduction and the "how it works" detail stack on the left, and the
 * login panel sits in its own column on the right, docked in a set of slow orbit rings
 * that spill back across the canvas. Below lg it collapses to one column in the order a
 * learner needs it: a short introduction, then the form, then the detail - so the fields
 * are reached without a long scroll.
 *
 * The content is the approved entry content, unchanged: the same headline, the same
 * assessment framing and synthetic-content disclosure, the same three steps, the same
 * "authorised training use" line, and the permanent TRAINING SIMULATION badge. The
 * redesign adds presentation only; the decorative layer is described in EntryVisuals.
 */
export function AuthLayout({ children }) {
  return (
    <div className="relative isolate min-h-dvh overflow-clip bg-entry">
      <EntryBackdrop />

      <div className="mx-auto grid min-h-dvh w-full max-w-[120rem] lg:grid-cols-[minmax(0,1fr)_minmax(30rem,40%)] lg:grid-rows-[auto_1fr] 2xl:grid-cols-[minmax(0,1fr)_minmax(29rem,44%)]">
        <section className="px-5 pt-6 pb-7 text-console-text sm:px-8 sm:pt-8 lg:col-start-1 lg:row-start-1 lg:px-12 lg:pt-10 lg:pb-0 xl:px-16 2xl:px-24 2xl:pt-14">
          <div
            {...rise(0)}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 motion-safe:animate-entry-rise"
          >
            <BrandLogo tone="light" />
            <SimulationBadge tone="light" />
          </div>

          <div className="mt-6 max-w-2xl sm:mt-10 lg:mt-10 xl:mt-12 2xl:mt-24 2xl:max-w-3xl">
            <span
              aria-hidden="true"
              {...rise(1)}
              className="block h-0.5 w-12 rounded-full bg-linear-to-r from-console-accent to-transparent motion-safe:animate-entry-rise"
            />
            <h1
              {...rise(2)}
              className="mt-4 text-[1.85rem] leading-[1.12] font-semibold tracking-[-0.02em] text-white motion-safe:animate-entry-rise sm:mt-5 sm:text-4xl lg:text-[2.4rem] xl:text-5xl 2xl:text-[3.6rem]"
            >
              Learn to spot online fraud{' '}
              <span className="bg-linear-to-r from-console-accent to-console-text bg-clip-text text-transparent">
                before it reaches you.
              </span>
            </h1>
            {/*
              Assessment framing, not "practice". The client has asked that this read as a
              measured exercise rather than an optional drill, so the sentence states what
              is being evaluated. The synthetic-content disclosure stays - it is a safety
              statement the specification requires, and it is not the casual half.
            */}
            <p
              {...rise(3)}
              className="mt-4 max-w-xl text-balance-pretty text-[0.95rem] text-console-muted motion-safe:animate-entry-rise sm:text-base lg:mt-5 xl:text-[1.05rem] 2xl:max-w-2xl"
            >
              Assessment environment. Your decisions will be evaluated across simulated
              communications. 
            </p>
          </div>
        </section>

        {/*
          On a short desktop screen the introduction column can outgrow the viewport; the
          panel is sticky there, so the form and its footer stay in view while it scrolls.

          This wrapper must never carry a transform (or filter, or will-change): the login
          dialogs render inside it, and a transformed ancestor would become the containing
          block of their fixed-position overlay and trap it inside the column. The panel's
          entrance animation therefore lives on EntryPanel itself.
        */}
        <main className="relative flex items-center justify-center px-4 pb-10 sm:px-6 sm:pb-12 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:px-8 lg:py-10 xl:px-14">
          <OrbitRings className="w-[150vw] opacity-60 sm:w-[118vw] lg:w-[68rem] lg:opacity-100 2xl:w-[80rem]" />
          <div className="relative w-full max-w-md lg:sticky lg:top-8 xl:max-w-[29rem] 2xl:max-w-[31rem]">
            {children}
          </div>
        </main>

        <section className="flex flex-col px-5 pb-8 text-console-text sm:px-8 lg:col-start-1 lg:row-start-2 lg:justify-end lg:px-12 lg:pt-8 lg:pb-8 xl:pt-10 xl:pb-10 xl:px-16 2xl:px-24 2xl:pb-14">
          <ChannelFeed {...rise(5)} className="max-w-3xl motion-safe:animate-entry-rise 2xl:max-w-4xl" />

          <h2 className="sr-only">How this training works</h2>
          <ol className="mt-4 grid max-w-3xl gap-3 2xl:max-w-4xl sm:mt-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 xl:gap-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                {...rise(6 + index)}
                className="flex gap-3.5 rounded-lg border border-entry-line bg-entry-raised p-4 lg:p-3.5 xl:p-4 motion-safe:animate-entry-rise md:flex-col md:gap-3 lg:flex-row lg:gap-3.5 xl:flex-col xl:gap-3"
              >
                <span className="flex shrink-0 items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-white/5 text-console-accent ring-1 ring-entry-line">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span aria-hidden="true" className="hidden font-mono text-xs tracking-[0.14em] text-console-muted md:inline lg:hidden xl:inline">
                    0{index + 1}
                  </span>
                </span>
                <span>
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-sm text-console-muted">{text}</span>
                </span>
              </li>
            ))}
          </ol>

          <p
            {...rise(9)}
            className="mt-6 flex items-center gap-2.5 text-sm text-console-muted motion-safe:animate-entry-rise lg:mt-8"
          >
            <span aria-hidden="true" className="h-px w-6 bg-entry-line-strong" />
            For authorised training use only.
          </p>
        </section>
      </div>
    </div>
  )
}
