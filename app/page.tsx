import { Candy, Sparkles, TrendingUp, Ticket } from 'lucide-react'
import { SweetMatchGame } from '@/components/sweet-match-game'

export default function Page() {
  return (
    <main className="min-h-dvh">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Candy className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              SweetMatch
            </span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground sm:flex">
            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
            Play to unlock real discounts
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-8 text-center sm:pt-12">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Gamified shopping experience
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-foreground text-balance sm:text-5xl">
          Match candies. Unlock discounts.{' '}
          <span className="text-primary">Turn viewers into buyers.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          A sweet match-3 game that rewards play with real coupon codes. The
          higher your score, the bigger the discount — so every match nudges
          players closer to checkout.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 sm:mt-10">
        <SweetMatchGame />
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            title="Addictive by design"
            body="Satisfying cascades and combo multipliers keep players matching for just one more move."
          />
          <Feature
            icon={<Ticket className="h-5 w-5" aria-hidden="true" />}
            title="Rewards that convert"
            body="Score thresholds unlock escalating discount codes, giving players a reason to spend them."
          />
          <Feature
            icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
            title="Viewers to buyers"
            body="Turn passive browsing into active engagement and a clear path straight to the checkout."
          />
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        SweetMatch — a gamified storefront demo.
      </footer>
    </main>
  )
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">{body}</p>
    </div>
  )
}
