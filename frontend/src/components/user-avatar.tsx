import type { ReactElement } from 'react'

type UserAvatarProps = {
  readonly fullName: string
  readonly sizeClassName?: string
}

function buildInitials(fullName: string): string {
  const parts: string[] = fullName
    .trim()
    .split(/\s+/)
    .filter((segment) => segment.length > 0)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first: string = parts[0].charAt(0)
  const last: string = parts[parts.length - 1].charAt(0)
  return `${first}${last}`.toUpperCase()
}

function pastelPair(fullName: string): { readonly from: string; readonly to: string } {
  let hash: number = 0
  for (let i = 0; i < fullName.length; i += 1) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h: number = Math.abs(hash) % 360
  const h2: number = (h + 28) % 360
  return {
    from: `hsl(${h} 70% 78%)`,
    to: `hsl(${h2} 65% 72%)`,
  }
}

export function UserAvatar(props: UserAvatarProps): ReactElement {
  const size: string = props.sizeClassName ?? 'h-10 w-10 text-sm'
  const { from, to } = pastelPair(props.fullName)
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-inner ring-2 ring-white ${size}`}
      style={{
        background: `linear-gradient(145deg, ${from}, ${to})`,
        textShadow: '0 1px 0 rgba(0,0,0,0.08)',
      }}
      title={props.fullName}
    >
      {buildInitials(props.fullName)}
    </div>
  )
}
