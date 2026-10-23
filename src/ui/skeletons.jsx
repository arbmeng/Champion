import { Card, Skeleton } from './primitives'

export function CardSkeleton({ lines = 3, h }) {
  return (
    <Card className="stack-sm" aria-hidden="true">
      <Skeleton h={14} w="40%" />
      {h ? <Skeleton h={h} r={12} /> : Array.from({ length: lines }, (_, i) => <Skeleton key={i} h={i === 0 ? 28 : 14} w={i === 0 ? '60%' : `${90 - i * 12}%`} />)}
    </Card>
  )
}

export function PageSkeleton() {
  return (
    <div className="stack" role="status" aria-label="Loading">
      <div className="stack-sm"><Skeleton h={12} w={90} /><Skeleton h={34} w="55%" /></div>
      <Skeleton h={220} r={16} />
      <div className="grid-4">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} lines={2} />)}</div>
      <div className="grid-2"><CardSkeleton h={160} /><CardSkeleton h={160} /></div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function ListSkeleton({ rows = 5 }) {
  return <div className="stack-sm" role="status" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={64} r={14} />)}</div>
}
