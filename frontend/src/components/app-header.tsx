import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { AuthSessionUser } from '../api/auth-api'
import { UserAvatar } from './user-avatar'

export type AppRoute =
  | 'home'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'compare'
  | 'profile'
  | 'product'
  | 'sign-in'
  | 'sign-up'

type AppHeaderProps = {
  readonly isAuthenticated: boolean
  readonly user: AuthSessionUser | null
  readonly cartItemCount: number
  readonly compareItemCount: number
  readonly activeRoute: AppRoute
  readonly onNavigate: (route: AppRoute) => void
  readonly onLogout: () => void
}

export function AppHeader(props: AppHeaderProps): ReactElement {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const navigateFromMenu = useCallback(
    (route: AppRoute): void => {
      props.onNavigate(route)
      setIsProfileMenuOpen(false)
    },
    [props],
  )
  const handleLogoutClick = useCallback((): void => {
    setIsProfileMenuOpen(false)
    props.onLogout()
  }, [props])
  useEffect(() => {
    if (!isProfileMenuOpen) {
      return
    }
    const handlePointerDown = (event: MouseEvent): void => {
      const el: HTMLDivElement | null = profileMenuRef.current
      if (el !== null && !el.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return (): void => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileMenuOpen])
  return (
    <header className="sticky top-0 z-20 border-b border-sky-100/90 bg-white/85 shadow-sm shadow-sky-100/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6">
        <button
          className="rounded-2xl px-1 text-left text-lg font-extrabold tracking-tight text-sky-900 transition hover:text-sky-700"
          onClick={() => props.onNavigate('home')}
          type="button"
        >
          Nova
          <span className="text-sky-500">Mart</span>
          <span aria-hidden className="ml-1.5 inline-block text-base">
            🍼
          </span>
        </button>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <button
            className={`relative rounded-full px-4 py-2 text-sm font-bold transition ${
              props.activeRoute === 'compare'
                ? 'bg-violet-100 text-violet-900'
                : 'bg-sky-50/80 text-sky-700 hover:bg-sky-100'
            }`}
            onClick={() => props.onNavigate('compare')}
            type="button"
          >
            <span className="hidden sm:inline">So sánh</span>
            <span className="sm:hidden" aria-hidden>
              ⚖️
            </span>
            {props.compareItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1 text-[11px] font-extrabold text-white shadow-sm">
                {props.compareItemCount > 9 ? '9+' : props.compareItemCount}
              </span>
            )}
          </button>
          {!props.isAuthenticated && (
            <button
              className={`relative rounded-full px-4 py-2 text-sm font-bold transition ${
                props.activeRoute === 'cart'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-sky-50/80 text-sky-700 hover:bg-sky-100'
              }`}
              onClick={() => props.onNavigate('cart')}
              type="button"
            >
              <span className="hidden sm:inline">Giỏ hàng</span>
              <span className="sm:hidden" aria-hidden>
                🛒
              </span>
              {props.cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-400 px-1 text-[11px] font-extrabold text-white shadow-sm">
                  {props.cartItemCount > 99 ? '99+' : props.cartItemCount}
                </span>
              )}
            </button>
          )}
          {props.isAuthenticated && props.user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 rounded-2xl py-1.5 pl-1 pr-2 transition sm:gap-2.5 sm:pr-3 ${
                  props.activeRoute === 'profile' ||
                  props.activeRoute === 'cart' ||
                  props.activeRoute === 'orders'
                    ? 'bg-sky-100 ring-1 ring-sky-200/80'
                    : 'hover:bg-sky-50/80'
                }`}
                onClick={() => setIsProfileMenuOpen((open: boolean) => !open)}
                type="button"
              >
                <UserAvatar fullName={props.user.fullName} />
                <div className="hidden max-w-[140px] truncate text-left sm:block">
                  <p className="truncate text-sm font-bold text-stone-800">
                    {props.user.fullName}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {props.user.email ?? props.user.phone}
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`text-stone-400 transition sm:ml-0 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                >
                  ▼
                </span>
              </button>
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 z-30 mt-2 min-w-[13.5rem] overflow-hidden rounded-2xl border border-sky-100 bg-white py-1 shadow-lg shadow-sky-200/40"
                  role="menu"
                >
                  <button
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bold transition hover:bg-sky-50 ${
                      props.activeRoute === 'profile'
                        ? 'bg-sky-50 text-sky-900'
                        : 'text-stone-800'
                    }`}
                    onClick={() => navigateFromMenu('profile')}
                    role="menuitem"
                    type="button"
                  >
                    Thông tin
                  </button>
                  <button
                    className={`relative flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bold transition hover:bg-sky-50 ${
                      props.activeRoute === 'cart'
                        ? 'bg-sky-50 text-sky-900'
                        : 'text-stone-800'
                    }`}
                    onClick={() => navigateFromMenu('cart')}
                    role="menuitem"
                    type="button"
                  >
                    <span>Giỏ hàng</span>
                    {props.cartItemCount > 0 && (
                      <span className="rounded-full bg-rose-400 px-2 py-0.5 text-[11px] font-extrabold text-white">
                        {props.cartItemCount > 99 ? '99+' : props.cartItemCount}
                      </span>
                    )}
                  </button>
                  <button
                    className={`flex w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-sky-50 ${
                      props.activeRoute === 'orders'
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-stone-800'
                    }`}
                    onClick={() => navigateFromMenu('orders')}
                    role="menuitem"
                    type="button"
                  >
                    Đơn hàng
                  </button>
                  <div className="my-1 border-t border-sky-100" />
                  <button
                    className="flex w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                    onClick={() => handleLogoutClick()}
                    role="menuitem"
                    type="button"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                className="rounded-full px-4 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
                onClick={() => props.onNavigate('sign-in')}
                type="button"
              >
                Đăng nhập
              </button>
              <button
                className="rounded-full bg-gradient-to-r from-sky-400 to-sky-500 px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-sky-200/80 transition hover:from-sky-500 hover:to-sky-600"
                onClick={() => props.onNavigate('sign-up')}
                type="button"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
