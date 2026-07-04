import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

// Curated set of project-relevant icons by category
export const PROJECT_ICONS: Record<string, string[]> = {
  Product: ['Box','Package','Layers','LayoutDashboard','Monitor','Smartphone','Globe','AppWindow','Tablet','Watch','Tv','Radio','Headphones','Camera','Printer','ScanLine'],
  Dev:     ['Code2','Terminal','GitBranch','Database','Server','Cpu','Bug','Braces','GitCommit','GitMerge','GitPullRequest','Webhook','Binary','Network','HardDrive','Cloud'],
  Design:  ['Pen','Paintbrush','Palette','Crop','Ruler','Shapes','Frame','PenTool','Vector','Spline','Pencil','Eraser','Scissors','Wand2','Pipette','Layers2'],
  Team:    ['Users','UserCircle','Building2','Briefcase','Handshake','Target','Trophy','Star','UserCheck','UserPlus','PersonStanding','Group','Crown','Medal','Award','BadgeCheck'],
  Work:    ['Rocket','Zap','Flame','ClipboardList','CheckSquare','ListTodo','BarChart2','TrendingUp','Activity','LineChart','PieChart','Gauge','Timer','AlarmClock','Calendar','CalendarCheck'],
  Plan:    ['Map','Compass','Flag','Milestone','Route','Navigation','Crosshair','Focus','Telescope','Binoculars','Search','ScanSearch','Microscope','FlaskConical','Beaker','TestTube'],
  Misc:    ['Leaf','Heart','Shield','Lock','Key','Lightbulb','Bolt','Anchor','Aperture','Archive','Bell','Bookmark','Box','Briefcase','Building','Cable'],
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
