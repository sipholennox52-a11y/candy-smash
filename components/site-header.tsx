'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Candy, ShoppingBag } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { CartDrawer } from '@/components/cart-drawer'

export function SiteHeader() {
  const { count } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Candy
              className="h-5 w-5 text-primary-foreground"
              aria-hidden="true"
            />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            SweetMatch
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Play
          </Link>
          <Link
            href="/shop"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Shop
          </Link>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-accent hover:text-accent-foreground"
            aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
          >
            <ShoppingBag className="h-4.5 w-4.5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        </nav>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  )
}
