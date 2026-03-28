import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthSessionUser,
} from './api/auth-api'
import type { UserProfile } from './api/users-api'
import {
  fetchCatalogBrands,
  fetchCatalogCategories,
  fetchCatalogProducts,
  type CatalogCategory,
  type CatalogProduct,
} from './api/catalog-api'
import { AppHeader, type AppRoute } from './components/app-header'
import { CartView } from './components/cart-view'
import { CheckoutView } from './components/checkout-view'
import { CompareView } from './components/compare-view'
import { OrderDetailView } from './components/order-detail-view'
import { OrdersListView } from './components/orders-list-view'
import { HomeView } from './components/home-view'
import { ProductDetailView } from './components/product-detail-view'
import { ProfileView } from './components/profile-view'
import { useCompareSlugs } from './hooks/use-compare-slugs'
import { useDebouncedValue } from './hooks/use-debounced-value'
import { useLocalCart } from './hooks/use-local-cart'

function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('home')
  const [productDetailSlug, setProductDetailSlug] = useState<string | null>(null)
  const [ordersFocusId, setOrdersFocusId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true)
  const [user, setUser] = useState<AuthSessionUser | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState<boolean>(false)
  const [signInPhone, setSignInPhone] = useState<string>('')
  const [signInPassword, setSignInPassword] = useState<string>('')
  const [signUpName, setSignUpName] = useState<string>('')
  const [signUpPhone, setSignUpPhone] = useState<string>('')
  const [signUpEmail, setSignUpEmail] = useState<string>('')
  const [signUpPassword, setSignUpPassword] = useState<string>('')
  const {
    lines: cartLines,
    totalItemCount,
    subtotalVnd,
    addProduct,
    setQuantity,
    removeLine,
    clearCart,
  } = useLocalCart()
  const {
    compareSlugs,
    compareCount,
    canAddMoreCompare,
    isCompareSlugSelected,
    toggleCompareSlug,
    removeCompareSlug,
    clearCompareSlugs,
  } = useCompareSlugs()
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [catalogTotal, setCatalogTotal] = useState<number>(0)
  const [catalogNextCursor, setCatalogNextCursor] = useState<string | null>(null)
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false)
  const [catalogLoadMorePending, setCatalogLoadMorePending] =
    useState<boolean>(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [categorySlug, setCategorySlug] = useState<string>('')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const debouncedSearch: string = useDebouncedValue(searchInput, 380)
  const navigate = useCallback((route: AppRoute): void => {
    setAuthError(null)
    setProductDetailSlug(null)
    if (route !== 'orders') {
      setOrdersFocusId(null)
    }
    setActiveRoute(route)
  }, [])
  const openProductDetail = useCallback((slug: string): void => {
    const t: string = slug.trim()
    if (t.length === 0) {
      return
    }
    setAuthError(null)
    setProductDetailSlug(t)
    setActiveRoute('product')
  }, [])
  useEffect(() => {
    let cancelled: boolean = false
    void (async (): Promise<void> => {
      try {
        const [cats, brs] = await Promise.all([
          fetchCatalogCategories(),
          fetchCatalogBrands(),
        ])
        if (!cancelled) {
          setCategories(cats)
          setBrands(brs)
        }
      } catch {
        if (!cancelled) {
          setCategories([])
          setBrands([])
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (activeRoute !== 'home') {
      return
    }
    let cancelled: boolean = false
    setCatalogLoading(true)
    setCatalogError(null)
    void (async (): Promise<void> => {
      try {
        const res = await fetchCatalogProducts({
          q: debouncedSearch.trim().length > 0 ? debouncedSearch : undefined,
          categorySlug: categorySlug.length > 0 ? categorySlug : undefined,
          brand: brandFilter.length > 0 ? brandFilter : undefined,
          limit: 48,
        })
        if (!cancelled) {
          setProducts([...res.items])
          setCatalogTotal(res.total)
          setCatalogNextCursor(res.nextCursor)
        }
      } catch {
        if (!cancelled) {
          setCatalogError('Không tải sản phẩm.')
          setProducts([])
          setCatalogTotal(0)
          setCatalogNextCursor(null)
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false)
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [activeRoute, debouncedSearch, categorySlug, brandFilter])
  const loadMoreCatalog = useCallback((): void => {
    if (catalogNextCursor === null) {
      return
    }
    setCatalogLoadMorePending(true)
    setCatalogError(null)
    void (async (): Promise<void> => {
      try {
        const res = await fetchCatalogProducts({
          q:
            debouncedSearch.trim().length > 0 ? debouncedSearch : undefined,
          categorySlug: categorySlug.length > 0 ? categorySlug : undefined,
          brand: brandFilter.length > 0 ? brandFilter : undefined,
          cursor: catalogNextCursor,
          limit: 48,
        })
        setProducts((prev) => [...prev, ...res.items])
        setCatalogTotal(res.total)
        setCatalogNextCursor(res.nextCursor)
      } catch {
        setCatalogError('Không tải thêm sản phẩm.')
      } finally {
        setCatalogLoadMorePending(false)
      }
    })()
  }, [brandFilter, catalogNextCursor, categorySlug, debouncedSearch])
  useEffect(() => {
    let cancelled: boolean = false
    void (async (): Promise<void> => {
      try {
        const sessionUser = await fetchCurrentUser()
        if (cancelled) {
          return
        }
        if (sessionUser) {
          setIsAuthenticated(true)
          setUser(sessionUser)
        }
      } catch {
        if (!cancelled) {
          setAuthError('Không kiểm tra được phiên đăng nhập')
        }
      } finally {
        if (!cancelled) {
          setIsSessionLoading(false)
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (isSessionLoading) {
      return
    }
    if (isAuthenticated && (activeRoute === 'sign-in' || activeRoute === 'sign-up')) {
      navigate('home')
    }
  }, [isSessionLoading, isAuthenticated, activeRoute, navigate])
  useEffect(() => {
    if (isSessionLoading) {
      return
    }
    if (activeRoute === 'profile' && !isAuthenticated) {
      navigate('sign-in')
    }
  }, [isSessionLoading, isAuthenticated, activeRoute, navigate])
  useEffect(() => {
    if (activeRoute === 'product' && (productDetailSlug === null || productDetailSlug === '')) {
      navigate('home')
    }
  }, [activeRoute, productDetailSlug, navigate])
  useEffect(() => {
    if (isSessionLoading) {
      return
    }
    if (activeRoute === 'checkout' && !isAuthenticated) {
      navigate('sign-in')
    }
  }, [isSessionLoading, isAuthenticated, activeRoute, navigate])
  useEffect(() => {
    if (isSessionLoading) {
      return
    }
    if (activeRoute === 'orders' && !isAuthenticated) {
      navigate('sign-in')
    }
  }, [isSessionLoading, isAuthenticated, activeRoute, navigate])
  useEffect(() => {
    if (activeRoute !== 'checkout') {
      return
    }
    if (cartLines.length === 0) {
      navigate('cart')
    }
  }, [activeRoute, cartLines.length, navigate])
  async function handleSignIn(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const phone: string = signInPhone.trim().replace(/\s+/g, '')
    if (!phone || !signInPassword) {
      return
    }
    setAuthError(null)
    setAuthPending(true)
    try {
      const result = await loginUser({ phone, password: signInPassword })
      setIsAuthenticated(true)
      setUser(result.user)
      navigate('home')
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setAuthPending(false)
    }
  }
  async function handleSignUp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const phone: string = signUpPhone.trim().replace(/\s+/g, '')
    const emailRaw: string = signUpEmail.trim().toLowerCase()
    if (!signUpName.trim() || !phone || !signUpPassword) {
      return
    }
    setAuthError(null)
    setAuthPending(true)
    try {
      const result = await registerUser({
        fullName: signUpName.trim(),
        phone,
        password: signUpPassword,
        ...(emailRaw.length > 0 ? { email: emailRaw } : {}),
      })
      setIsAuthenticated(true)
      setUser(result.user)
      navigate('home')
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setAuthPending(false)
    }
  }
  async function handleLogout(): Promise<void> {
    setAuthError(null)
    try {
      await logoutUser()
    } catch {
      /* ignore */
    }
    setIsAuthenticated(false)
    setUser(null)
    navigate('home')
  }
  function handleProfileSaved(profile: UserProfile): void {
    setUser({
      id: profile.id,
      phone: profile.phone,
      email: profile.email,
      fullName: profile.fullName,
    })
  }
  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-sky-50 to-white text-sky-700">
        <span className="text-4xl" aria-hidden>
          🍼
        </span>
        <p className="text-sm font-bold">Đang tải…</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/90 via-white to-amber-50/40 text-stone-700">
      <AppHeader
        activeRoute={activeRoute}
        cartItemCount={totalItemCount}
        compareItemCount={compareCount}
        isAuthenticated={isAuthenticated}
        onLogout={() => void handleLogout()}
        onNavigate={navigate}
        user={user}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {(activeRoute === 'sign-in' || activeRoute === 'sign-up') && authError && (
          <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700">
            {authError}
          </p>
        )}
        {activeRoute === 'profile' && isAuthenticated && user && (
          <ProfileView
            onBack={() => navigate('home')}
            onProfileSaved={handleProfileSaved}
            sessionUser={user}
          />
        )}
        {activeRoute === 'home' && (
          <HomeView
            brand={brandFilter}
            brands={brands}
            canAddMoreToCompare={canAddMoreCompare}
            categories={categories}
            categorySlug={categorySlug}
            isLoading={catalogLoading}
            isProductInCompare={(slug) => isCompareSlugSelected(slug)}
            hasMore={catalogNextCursor !== null}
            loadError={catalogError}
            loadMorePending={catalogLoadMorePending}
            onAddToCart={(product) =>
              addProduct({
                productId: product.id,
                name: product.name,
                priceVnd: product.priceVnd,
                imageUrl: product.imageUrl,
              })
            }
            onBrandChange={setBrandFilter}
            onCategoryChange={setCategorySlug}
            onLoadMore={loadMoreCatalog}
            onOpenProduct={(p) => openProductDetail(p.slug)}
            onSearchInputChange={setSearchInput}
            onToggleCompareProduct={(p) => toggleCompareSlug(p.slug)}
            products={products}
            searchInput={searchInput}
            total={catalogTotal}
          />
        )}
        {activeRoute === 'product' && productDetailSlug !== null && productDetailSlug.length > 0 && (
          <ProductDetailView
            canAddMoreToCompare={canAddMoreCompare}
            isInCompare={isCompareSlugSelected(productDetailSlug)}
            onAddToCart={(p) => {
              const imageUrl: string = p.images.length > 0 ? p.images[0].url : ''
              addProduct({
                productId: p.id,
                name: p.name,
                priceVnd: p.priceVnd,
                imageUrl,
              })
            }}
            onBack={() => navigate('home')}
            onToggleCompare={() => toggleCompareSlug(productDetailSlug)}
            slug={productDetailSlug}
          />
        )}
        {activeRoute === 'compare' && (
          <CompareView
            onBackToShop={() => navigate('home')}
            onClearAll={() => clearCompareSlugs()}
            onOpenProduct={(slug) => openProductDetail(slug)}
            onRemoveSlug={(slug) => removeCompareSlug(slug)}
            slugs={compareSlugs}
          />
        )}
        {activeRoute === 'cart' && (
          <CartView
            lines={cartLines}
            onCheckout={() => {
              if (!isAuthenticated) {
                navigate('sign-in')
                return
              }
              navigate('checkout')
            }}
            onContinueShopping={() => navigate('home')}
            onRemove={removeLine}
            onSetQuantity={setQuantity}
            subtotalVnd={subtotalVnd}
          />
        )}
        {activeRoute === 'checkout' && isAuthenticated && user && (
          <CheckoutView
            lines={cartLines}
            prefillUserId={user.id}
            subtotalVnd={subtotalVnd}
            onBack={() => navigate('cart')}
            onSuccess={(orderId: string) => {
              clearCart()
              navigate('orders')
              setOrdersFocusId(orderId)
            }}
          />
        )}
        {activeRoute === 'orders' && isAuthenticated && (
          ordersFocusId !== null ? (
            <OrderDetailView
              orderId={ordersFocusId}
              onBack={() => setOrdersFocusId(null)}
            />
          ) : (
            <OrdersListView
              onBack={() => navigate('home')}
              onOpenOrder={(id: string) => setOrdersFocusId(id)}
            />
          )
        )}
        {activeRoute === 'sign-in' && (
          <section className="mx-auto max-w-md rounded-3xl border border-sky-100 bg-white/90 p-8 shadow-lg">
            <h2 className="text-2xl font-extrabold text-sky-900">Đăng nhập</h2>
            <form className="mt-6 space-y-4" onSubmit={(e) => void handleSignIn(e)}>
              <input
                autoComplete="tel"
                className="w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                placeholder="Số điện thoại"
                type="tel"
                value={signInPhone}
                onChange={(e) => setSignInPhone(e.target.value)}
              />
              <input
                autoComplete="current-password"
                className="w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                placeholder="Mật khẩu"
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
              />
              <button
                className="w-full rounded-2xl bg-sky-500 py-3.5 font-extrabold text-white disabled:opacity-50"
                disabled={authPending}
                type="submit"
              >
                {authPending ? 'Đang vào…' : 'Đăng nhập'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-stone-500">
              Chưa có tài khoản?{' '}
              <button
                className="font-extrabold text-sky-600 hover:underline"
                onClick={() => navigate('sign-up')}
                type="button"
              >
                Đăng ký
              </button>
            </p>
          </section>
        )}
        {activeRoute === 'sign-up' && (
          <section className="mx-auto max-w-md rounded-3xl border border-sky-100 bg-white/90 p-8 shadow-lg">
            <h2 className="text-2xl font-extrabold text-sky-900">Đăng ký</h2>
            <form className="mt-6 space-y-4" onSubmit={(e) => void handleSignUp(e)}>
              <input
                className="w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                placeholder="Họ tên"
                type="text"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
              />
              <input
                autoComplete="tel"
                className="w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                placeholder="Số điện thoại"
                required
                type="tel"
                value={signUpPhone}
                onChange={(e) => setSignUpPhone(e.target.value)}
              />
              <input
                autoComplete="email"
                className="w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                placeholder="Email (tuỳ chọn)"
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
              />
              <input
                autoComplete="new-password"
                className="w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                placeholder="Mật khẩu"
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
              />
              <button
                className="w-full rounded-2xl bg-amber-400 py-3.5 font-extrabold text-amber-950 disabled:opacity-50"
                disabled={authPending}
                type="submit"
              >
                {authPending ? 'Đang tạo…' : 'Tạo tài khoản'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-stone-500">
              Đã có tài khoản?{' '}
              <button
                className="font-extrabold text-sky-600 hover:underline"
                onClick={() => navigate('sign-in')}
                type="button"
              >
                Đăng nhập
              </button>
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
