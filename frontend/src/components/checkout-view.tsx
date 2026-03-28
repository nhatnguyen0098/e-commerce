import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import {
  createOrderCheckout,
  type PaymentProviderApi,
} from '../api/orders-api'
import {
  fetchUserProfile,
  type UserProfile,
  type UserSavedAddress,
} from '../api/users-api'
import type { CartLine } from '../hooks/use-local-cart'
import { formatVnd } from '../utils/format-vnd'

type CheckoutViewProps = {
  readonly lines: readonly CartLine[]
  readonly prefillUserId: string
  readonly subtotalVnd: number
  readonly onBack: () => void
  readonly onSuccess: (orderId: string) => void
}

function applySavedAddress(
  address: UserSavedAddress,
  profile: UserProfile,
  setters: {
    readonly setRecipientName: (v: string) => void
    readonly setPhone: (v: string) => void
    readonly setLine1: (v: string) => void
    readonly setLine2: (v: string) => void
    readonly setWard: (v: string) => void
    readonly setDistrict: (v: string) => void
    readonly setCity: (v: string) => void
    readonly setPostalCode: (v: string) => void
    readonly setContactEmail: (v: string) => void
  },
): void {
  setters.setRecipientName(address.recipientName)
  setters.setPhone(address.phone)
  setters.setLine1(address.line1)
  setters.setLine2(address.line2 ?? '')
  setters.setWard(address.ward)
  setters.setDistrict(address.district)
  setters.setCity(address.city)
  setters.setPostalCode(address.postalCode ?? '')
  setters.setContactEmail(profile.email ?? '')
}

export function CheckoutView(props: CheckoutViewProps): ReactElement {
  const { lines, prefillUserId, subtotalVnd, onBack, onSuccess } = props
  const [recipientName, setRecipientName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [contactEmail, setContactEmail] = useState<string>('')
  const [line1, setLine1] = useState<string>('')
  const [line2, setLine2] = useState<string>('')
  const [ward, setWard] = useState<string>('')
  const [district, setDistrict] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [postalCode, setPostalCode] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProviderApi>('COD')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<boolean>(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileHint, setProfileHint] = useState<string | null>(null)
  const [savedAddressId, setSavedAddressId] = useState<string>('')
  useEffect(() => {
    let cancelled: boolean = false
    setProfile(null)
    setProfileHint(null)
    setSavedAddressId('')
    void (async (): Promise<void> => {
      try {
        const loaded: UserProfile = await fetchUserProfile(prefillUserId)
        if (cancelled) {
          return
        }
        setProfile(loaded)
        setContactEmail(loaded.email ?? '')
        if (loaded.addresses.length > 0) {
          const first: UserSavedAddress = loaded.addresses[0]
          setSavedAddressId(first.id)
          applySavedAddress(first, loaded, {
            setRecipientName,
            setPhone,
            setLine1,
            setLine2,
            setWard,
            setDistrict,
            setCity,
            setPostalCode,
            setContactEmail,
          })
        } else {
          setRecipientName(loaded.fullName)
          setPhone(loaded.phone)
        }
      } catch {
        if (!cancelled) {
          setProfileHint('Không tải được hồ sơ — nhập thông tin giao hàng thủ công.')
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [prefillUserId])
  const handleSavedAddressChange = useCallback(
    (value: string): void => {
      setSavedAddressId(value)
      if (value === '' || profile === null) {
        return
      }
      const found: UserSavedAddress | undefined = profile.addresses.find(
        (a: UserSavedAddress) => a.id === value,
      )
      if (found !== undefined) {
        applySavedAddress(found, profile, {
          setRecipientName,
          setPhone,
          setLine1,
          setLine2,
          setWard,
          setDistrict,
          setCity,
          setPostalCode,
          setContactEmail,
        })
      }
    },
    [profile],
  )
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault()
      const cartLines: readonly CartLine[] = lines
      if (cartLines.length === 0) {
        return
      }
      setError(null)
      setPending(true)
      try {
        const result = await createOrderCheckout({
          items: cartLines.map((line: CartLine) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
          shippingAddress: {
            recipientName: recipientName.trim(),
            phone: phone.trim(),
            line1: line1.trim(),
            ...(line2.trim().length > 0 ? { line2: line2.trim() } : {}),
            ward: ward.trim(),
            district: district.trim(),
            city: city.trim(),
            ...(postalCode.trim().length > 0
              ? { postalCode: postalCode.trim() }
              : {}),
            ...(contactEmail.trim().length > 0
              ? { contactEmail: contactEmail.trim().toLowerCase() }
              : {}),
          },
          paymentProvider,
          ...(notes.trim().length > 0 ? { notes: notes.trim() } : {}),
        })
        onSuccess(result.orderId)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Đặt hàng thất bại')
      } finally {
        setPending(false)
      }
    },
    [
      city,
      contactEmail,
      district,
      line1,
      line2,
      lines,
      notes,
      onSuccess,
      paymentProvider,
      phone,
      postalCode,
      recipientName,
      ward,
    ],
  )
  return (
    <div>
      <button
        className="mb-6 rounded-full bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-800 hover:bg-sky-100"
        onClick={() => onBack()}
        type="button"
      >
        ← Về giỏ hàng
      </button>
      <h1 className="text-2xl font-extrabold text-sky-900 sm:text-3xl">
        Thanh toán
      </h1>
      <p className="mt-2 text-sm font-medium text-stone-500">
        Đơn giá lấy theo hệ thống tại thời điểm đặt hàng (không dùng giá cache trên
        trình duyệt làm căn cứ thanh toán).
      </p>
      {profileHint !== null && (
        <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-2 text-sm font-medium text-amber-900">
          {profileHint}
        </p>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <form
          className="space-y-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm lg:col-span-3"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <h2 className="text-lg font-extrabold text-sky-900">Giao hàng</h2>
          {profile !== null && profile.addresses.length > 0 && (
            <label className="block">
              <span className="text-xs font-extrabold text-stone-400">
                Địa chỉ đã lưu
              </span>
              <select
                className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3 font-semibold text-stone-800"
                value={savedAddressId}
                onChange={(e) => handleSavedAddressChange(e.target.value)}
              >
                <option value="">Nhập / chỉnh tay</option>
                {profile.addresses.map((a: UserSavedAddress) => (
                  <option key={a.id} value={a.id}>
                    {a.label !== undefined && a.label.trim().length > 0
                      ? a.label
                      : `${a.line1}, ${a.ward}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="text-xs font-extrabold text-stone-400">
              Người nhận
            </span>
            <input
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
              required
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-stone-400">
              Điện thoại
            </span>
            <input
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-stone-400">
              Email liên hệ (tuỳ chọn, lưu trên đơn)
            </span>
            <input
              autoComplete="email"
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
              placeholder="Tự điền từ hồ sơ nếu có"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-stone-400">
              Địa chỉ (số nhà, đường)
            </span>
            <input
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
              required
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-stone-400">
              Địa chỉ 2 (tuỳ chọn)
            </span>
            <input
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-extrabold text-stone-400">Phường/Xã</span>
              <input
                className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                required
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-extrabold text-stone-400">Quận/Huyện</span>
              <input
                className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                required
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-extrabold text-stone-400">Tỉnh/Thành</span>
              <input
                className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
                required
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-extrabold text-stone-400">
              Mã bưu điện (tuỳ chọn)
            </span>
            <input
              className="mt-1 w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-stone-400">
              Ghi chú đơn hàng
            </span>
            <textarea
              className="mt-1 min-h-[88px] w-full rounded-2xl border-2 border-sky-100 px-4 py-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <fieldset className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <legend className="px-1 text-xs font-extrabold text-amber-900">
              Thanh toán
            </legend>
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input
                checked={paymentProvider === 'COD'}
                name="pay"
                type="radio"
                onChange={() => setPaymentProvider('COD')}
              />
              <span className="text-sm font-bold text-stone-800">
                COD — Thanh toán khi nhận hàng
              </span>
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input
                checked={paymentProvider === 'MANUAL'}
                name="pay"
                type="radio"
                onChange={() => setPaymentProvider('MANUAL')}
              />
              <span className="text-sm font-bold text-stone-800">
                Chuyển khoản (đơn chờ xác nhận thanh toán)
              </span>
            </label>
          </fieldset>
          {error !== null && (
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          )}
          <button
            className="w-full rounded-2xl bg-sky-500 py-3.5 font-extrabold text-white disabled:opacity-50"
            disabled={pending || lines.length === 0}
            type="submit"
          >
            {pending ? 'Đang xử lý…' : 'Xác nhận đặt hàng'}
          </button>
        </form>
        <aside className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-extrabold text-sky-900">Đơn hàng</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map((line: CartLine) => (
              <li className="flex justify-between gap-2" key={line.productId}>
                <span className="min-w-0 truncate font-semibold text-stone-800">
                  {line.name}{' '}
                  <span className="text-stone-400">×{line.quantity}</span>
                </span>
                <span className="shrink-0 font-bold text-sky-700">
                  {formatVnd(line.priceVnd * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-sky-100 pt-4 text-lg font-extrabold text-stone-800">
            Tạm tính:{' '}
            <span className="text-sky-600">{formatVnd(subtotalVnd)}</span>
          </p>
        </aside>
      </div>
    </div>
  )
}
