const shapes = {
  Activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  ArrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  ArrowUpRight: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
  Bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  Check: <path d="m5 12 4 4L19 6" />,
  ChevronDown: <path d="m6 9 6 6 6-6" />,
  ChevronRight: <path d="m9 18 6-6-6-6" />,
  CircleHelp: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  Clock3: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  Dumbbell: <><path d="m6.5 6.5 11 11" /><path d="m21 21-1.5-1.5M3 3l1.5 1.5" /><path d="M11 6 6 11M18 13l-5 5" /><path d="m3 7 4-4M17 21l4-4" /><path d="m5 3-2 2M21 19l-2 2" /></>,
  Flame: <path d="M8.5 14.5A3.5 3.5 0 0 0 12 18a3.5 3.5 0 0 0 3.5-3.5c0-1.8-1.2-2.8-2.1-3.8-.9-1-1.4-2.1-1.4-3.7-2.3 1.4-3.5 3.2-3.5 5.3 0 .8.2 1.5.6 2.2-.2-.2-.4-.3-.6-.5ZM12 22a8 8 0 0 0 8-8c0-3.5-2-6.3-5-8 0 2.3.2 3.2 1 4.7-2.3-1.3-3.6-3.8-3.7-7.7C8.5 6 4 9.4 4 14a8 8 0 0 0 8 8Z" />,
  Footprints: <><path d="M4 16c.6-2 2-3 3.6-2.8 1.7.2 2.6 1.8 2.4 3.8-.2 2.2-1.6 3.8-3.3 3.6C4.8 20.5 3.4 18.5 4 16Z" /><path d="M14 5c.6-2 2-3 3.6-2.8 1.7.2 2.6 1.8 2.4 3.8-.2 2.2-1.6 3.8-3.3 3.6C14.8 9.5 13.4 7.5 14 5Z" /><path d="M12 21c-.1-2.5 1.1-4.5 3.2-4.7 1.7-.2 3.2 1 3.7 2.7M2.5 12c.5-2 2-3.1 3.8-2.8" /></>,
  History: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
  Home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
  MoreHorizontal: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  Plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  Search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  Settings2: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M2 14h4M10 8h4M18 16h4" /></>,
  ShieldCheck: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  Sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
  Trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></>,
  UserRound: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  X: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name]}</svg>
}

export const Activity = (props) => <Icon name="Activity" {...props} />
export const ArrowRight = (props) => <Icon name="ArrowRight" {...props} />
export const ArrowUpRight = (props) => <Icon name="ArrowUpRight" {...props} />
export const Bell = (props) => <Icon name="Bell" {...props} />
export const Check = (props) => <Icon name="Check" {...props} />
export const ChevronDown = (props) => <Icon name="ChevronDown" {...props} />
export const ChevronRight = (props) => <Icon name="ChevronRight" {...props} />
export const CircleHelp = (props) => <Icon name="CircleHelp" {...props} />
export const Clock3 = (props) => <Icon name="Clock3" {...props} />
export const Dumbbell = (props) => <Icon name="Dumbbell" {...props} />
export const Flame = (props) => <Icon name="Flame" {...props} />
export const Footprints = (props) => <Icon name="Footprints" {...props} />
export const History = (props) => <Icon name="History" {...props} />
export const Home = (props) => <Icon name="Home" {...props} />
export const MoreHorizontal = (props) => <Icon name="MoreHorizontal" {...props} />
export const Plus = (props) => <Icon name="Plus" {...props} />
export const Search = (props) => <Icon name="Search" {...props} />
export const Settings2 = (props) => <Icon name="Settings2" {...props} />
export const ShieldCheck = (props) => <Icon name="ShieldCheck" {...props} />
export const Sparkles = (props) => <Icon name="Sparkles" {...props} />
export const Trophy = (props) => <Icon name="Trophy" {...props} />
export const UserRound = (props) => <Icon name="UserRound" {...props} />
export const X = (props) => <Icon name="X" {...props} />
