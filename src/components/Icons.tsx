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

export const IconCheckBox = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <rect x={4} y={4} width={16} height={16} rx={4} />
    <path d="M8.5 12.2l2.6 2.6 4.4-5.4" />
  </svg>
)

export const IconProjects = ({ size = 19 }: IconProps) => (
  <svg {...base(size)}>
    <rect x={3} y={7} width={18} height={13} rx={2.5} />
    <path d="M9 7V5h6v2" />
  </svg>
)

