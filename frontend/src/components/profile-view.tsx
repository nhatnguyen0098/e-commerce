import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import type { AuthSessionUser } from '../api/auth-api'
import {
  fetchUserProfile,
  updateUserProfile,
  type UserProfile,
  type UserSavedAddress,
} from '../api/users-api'

type ProfileViewProps = {
  readonly sessionUser: AuthSessionUser
  readonly onProfileSaved: (profile: UserProfile) => void
  readonly onBack: () => void
}

function newAddressRow(): UserSavedAddress {
  return {
    id: crypto.randomUUID(),
    recipientName: '',
    phone: '',
    line1: '',
    ward: '',
    district: '',
    city: '',
  }
}

function isCompleteAddress(a: UserSavedAddress): boolean {
  return (
    a.recipientName.trim().length > 0 &&
    a.phone.replace(/\s+/g, '').length >= 8 &&
    a.line1.trim().length > 0 &&
    a.ward.trim().length > 0 &&
    a.district.trim().length > 0 &&
    a.city.trim().length > 0
  )
}

function patchAddressAt(
  list: UserSavedAddress[],
  index: number,
  patch: Partial<UserSavedAddress>,
): UserSavedAddress[] {
  return list.map((row, i) => (i === index ? { ...row, ...patch } : row))
}

export function ProfileView(props: ProfileViewProps): ReactElement {
  const [fullName, setFullName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [addresses, setAddresses] = useState<UserSavedAddress[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savePending, setSavePending] = useState<boolean>(false)
  const loadProfile = useCallback(async (): Promise<void> => {
    setLoadError(null)
    try {
      const profile: UserProfile = await fetchUserProfile(props.sessionUser.id)
      setFullName(profile.fullName)
      setPhone(profile.phone)
      setEmail(profile.email ?? '')
      setAddresses(
        profile.addresses.length > 0
          ? [...profile.addresses]
          : [],
      )
    } catch {
      setLoadError('Không tải được hồ sơ.')
    }
  }, [props.sessionUser.id])
  useEffect(() => {
    void loadProfile()
  }, [loadProfile])
  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSaveError(null)
    const phoneNorm: string = phone.trim().replace(/\s+/g, '')
    if (phoneNorm.length < 8) {
      setSaveError('Số điện thoại không hợp lệ.')
      return
    }
    const completeAddresses: UserSavedAddress[] = addresses.filter(isCompleteAddress)
    setSavePending(true)
    try {
      const profile: UserProfile = await updateUserProfile(props.sessionUser.id, {
        fullName: fullName.trim(),
        email: email.trim().length > 0 ? email.trim().toLowerCase() : null,
        phone: phoneNorm,
        addresses: completeAddresses,
      })
      props.onProfileSaved(profile)
      setFullName(profile.fullName)
      setPhone(profile.phone)
      setEmail(profile.email ?? '')
      setAddresses(
        profile.addresses.length > 0 ? [...profile.addresses] : [],
      )
    } catch {
      setSaveError('Lưu thất bại.')
    } finally {
      setSavePending(false)
    }
  }
  return (
    <div>
      <button
        className="mb-6 rounded-full bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-800 hover:bg-sky-100"
        onClick={() => props.onBack()}
        type="button"
      >
        ← Về cửa hàng
      </button>
      <h1 className="text-2xl font-extrabold text-sky-900">Tài khoản</h1>
      {loadError !== null && (
        <p className="mt-4 text-rose-600">{loadError}</p>
      )}
      <form
        className="mx-auto mt-6 max-w-3xl space-y-8"
        onSubmit={(e) => void handleSave(e)}
      >
        <section className="space-y-5 rounded-3xl border-2 border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/50 p-8 shadow-md sm:p-10 sm:space-y-6">
          <h2 className="text-lg font-extrabold text-sky-900 sm:text-xl">
            Thông tin cơ bản
          </h2>
          <label className="block">
            <span className="text-sm font-extrabold text-stone-500">Họ tên</span>
            <input
              className="mt-2 w-full rounded-2xl border-2 border-sky-100 bg-white px-5 py-4 text-base text-stone-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-extrabold text-stone-500">
              Số điện thoại (đăng nhập)
            </span>
            <input
              autoComplete="tel"
              className="mt-2 w-full rounded-2xl border-2 border-sky-100 bg-white px-5 py-4 text-base text-stone-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-extrabold text-stone-500">
              Email (tuỳ chọn)
            </span>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border-2 border-sky-100 bg-white px-5 py-4 text-base text-stone-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
              placeholder="Để trống để xóa email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </section>
        <section className="space-y-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-sky-800">Địa chỉ giao hàng</h2>
              <p className="mt-1 text-xs font-medium text-stone-500">
                Chỉ các địa chỉ điền đủ các trường bắt buộc mới được lưu (tối đa 20).
              </p>
            </div>
            <button
              className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100"
              disabled={addresses.length >= 20}
              onClick={() => setAddresses((prev) => [...prev, newAddressRow()])}
              type="button"
            >
              + Thêm địa chỉ
            </button>
          </div>
          {addresses.length === 0 && (
            <p className="text-sm text-stone-500">Chưa có địa chỉ đã lưu.</p>
          )}
          <ul className="space-y-6">
            {addresses.map((addr: UserSavedAddress, index: number) => (
              <li
                className="rounded-2xl border border-sky-100 bg-sky-50/30 p-4"
                key={addr.id}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-stone-500">
                    Địa chỉ {index + 1}
                  </span>
                  <button
                    className="text-xs font-extrabold text-rose-600 hover:underline"
                    onClick={() =>
                      setAddresses((prev) => prev.filter((_, i) => i !== index))
                    }
                    type="button"
                  >
                    Xóa
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-extrabold text-stone-400">
                      Nhãn (tuỳ chọn)
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      placeholder="VD: Nhà riêng"
                      type="text"
                      value={addr.label ?? ''}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, {
                            label:
                              e.target.value.trim().length > 0
                                ? e.target.value.trim()
                                : undefined,
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-extrabold text-stone-400">
                      Người nhận
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="text"
                      value={addr.recipientName}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, {
                            recipientName: e.target.value,
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-extrabold text-stone-400">
                      Điện thoại
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="tel"
                      value={addr.phone}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, { phone: e.target.value }),
                        )
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-extrabold text-stone-400">
                      Địa chỉ (số nhà, đường)
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="text"
                      value={addr.line1}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, { line1: e.target.value }),
                        )
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-extrabold text-stone-400">
                      Địa chỉ 2
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="text"
                      value={addr.line2 ?? ''}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, { line2: e.target.value }),
                        )
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-extrabold text-stone-400">
                      Phường/Xã
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="text"
                      value={addr.ward}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, { ward: e.target.value }),
                        )
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-extrabold text-stone-400">
                      Quận/Huyện
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="text"
                      value={addr.district}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, { district: e.target.value }),
                        )
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-extrabold text-stone-400">
                      Tỉnh/Thành
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="text"
                      value={addr.city}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, { city: e.target.value }),
                        )
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-extrabold text-stone-400">
                      Mã bưu điện
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-sky-100 px-3 py-2 text-sm"
                      type="text"
                      value={addr.postalCode ?? ''}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          patchAddressAt(prev, index, {
                            postalCode: e.target.value,
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>
        {saveError !== null && (
          <p className="text-sm font-semibold text-rose-600">{saveError}</p>
        )}
        <button
          className="w-full rounded-2xl bg-sky-500 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-sky-600 disabled:opacity-50"
          disabled={savePending}
          type="submit"
        >
          {savePending ? 'Đang lưu…' : 'Lưu'}
        </button>
      </form>
    </div>
  )
}
