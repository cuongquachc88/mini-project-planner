import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

// Curated set of project-relevant icons by category
export const PROJECT_ICONS: Record<string, string[]> = {
  Product: ['Box','Package','Layers','LayoutDashboard','Monitor','Smartphone','Globe','AppWindow'],
  Dev:     ['Code2','Terminal','GitBranch','Database','Server','Cpu','Bug','Braces'],
  Design:  ['Pen','Paintbrush','Palette','Figma','Crop','Ruler','Shapes','Frame'],
  Team:    ['Users','UserCircle','Building2','Briefcase','Handshake','Target','Trophy','Star'],
  Work:    ['Rocket','Zap','Flame','Bolt','ClipboardList','CheckSquare','ListTodo','BarChart2'],
  Misc:    ['Leaf','Globe2','Heart','Shield','Lock','Key','Lightbulb','Compass'],
}


interface ProjectAvatarProps {
  color: string | null
  icon: string | null
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function ProjectAvatar({ color, icon, size = 'sm', className }: ProjectAvatarProps) {
  const bg = color ?? '#7c3aed'
  const sizeMap = { xs: 'w-4 h-4', sm: 'w-6 h-6', md: 'w-8 h-8' }
  const iconSizeMap = { xs: 8, sm: 11, md: 14 }

  const IconComponent = icon ? (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[icon] : null

  return (
    <div
      className={`${sizeMap[size]} rounded-md shrink-0 flex items-center justify-center ${className ?? ''}`}
      style={{ backgroundColor: bg }}
    >
      {IconComponent
        ? <IconComponent size={iconSizeMap[size]} strokeWidth={1.8} className="text-white/90" />
        : <span className="text-white/80 font-bold" style={{ fontSize: iconSizeMap[size] - 1 }}>
            {' '}
          </span>
      }
    </div>
  )
}
