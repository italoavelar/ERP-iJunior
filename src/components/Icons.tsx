interface IconProps {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
})

export const IconDashboard = ({ size = 19 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.8V21h14V9.8" />
  </svg>
)

export const IconProjects = ({ size = 19 }: IconProps) => (
  <svg {...base(size)}>
    <rect x={3} y={7} width={18} height={13} rx={2.5} />
    <path d="M9 7V5h6v2" />
  </svg>
)

export const IconTasks = ({ size = 19 }: IconProps) => (
  <svg {...base(size)}>
    <rect x={4} y={4} width={16} height={16} rx={3.5} />
    <path d="M8.5 12.2l2.6 2.6 4.4-5.4" />
  </svg>
)

export const IconBell = ({ size = 19 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)

export const IconSettings = ({ size = 19 }: IconProps) => (
  <svg {...base(size)} strokeLinecap={undefined}>
    <circle cx={12} cy={12} r={3} />
    <circle cx={12} cy={12} r={8} />
  </svg>
)

export const IconSun = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx={12} cy={12} r={4} />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
  </svg>
)

export const IconMoon = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z" />
  </svg>
)

export const IconPlus = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconClose = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconSearch = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx={11} cy={11} r={7} />
    <path d="M20 20l-4-4" />
  </svg>
)

export const IconChevronLeft = ({ size = 15 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const IconEdit = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </svg>
)

export const IconTrash = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />
  </svg>
)

export const IconCheck = ({ size = 12 }: IconProps) => (
  <svg {...base(size)} strokeWidth={3.2}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)

export const IconAlert = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v3.5M12 17h.01" />
  </svg>
)

export const IconDoc = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
  </svg>
)

export const IconDots = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx={6} cy={12} r={1.6} />
    <circle cx={12} cy={12} r={1.6} />
    <circle cx={18} cy={12} r={1.6} />
  </svg>
)

export const IconCheckBox = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <rect x={4} y={4} width={16} height={16} rx={4} />
    <path d="M8.5 12.2l2.6 2.6 4.4-5.4" />
  </svg>
)
