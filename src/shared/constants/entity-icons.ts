import {
  AlertTriangle,
  ArrowRight,
  Bolt,
  Boxes,
  Briefcase,
  Building2,
  Cable,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Clipboard,
  ClipboardCheck,
  Clock,
  Cog,
  Construction,
  DraftingCompass,
  Drill,
  Eye,
  Factory,
  FileCog,
  FileSpreadsheet,
  FileText,
  Flame,
  FolderKanban,
  FoldHorizontal,
  Gauge,
  HardHat,
  Hash,
  InspectionPanel,
  Layers3,
  LucideIcon,
  Minus,
  Package,
  PaintBucket,
  Pause,
  Pencil,
  Pickaxe,
  Play,
  Ruler,
  Save,
  Scissors,
  Search,
  Settings,
  ShieldCheck,
  SquareStack,
  StopCircle,
  Truck,
  User,
  Users,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react"

export const ENTITY_ICONS = {

  // EMPRESA

  factory: Factory,
  project: FolderKanban,
  client: Building2,
  briefcase: Briefcase,

  // PERSONAS

  user: User,
  users: Users,
  operator: HardHat,
  manager: Briefcase,
  engineer: DraftingCompass,

  // PRODUCCIÓN

  workflow: ArrowRight,
  production: Factory,
  station: SquareStack,
  machine: Cog,

  // PROCESOS

  scissors: Scissors,
  fold: FoldHorizontal,
  flame: Flame,
  paint: PaintBucket,
  package: Package,
  truck: Truck,

  laser: Zap,
  plasma: Bolt,
  drill: Drill,
  cnc: Cog,
  tool: Wrench,

  // MATERIALES

  material: InspectionPanel,
  warehouse: Warehouse,
  boxes: Boxes,
  layer: Layers3,
  construction: Construction,
  measure: Ruler,

  // CALIDAD

  quality: ClipboardCheck,
  shield: ShieldCheck,
  inspect: Eye,
  search: Search,

  // DOCUMENTOS

  document: FileText,
  clipboard: Clipboard,
  fileCog: FileCog,
  spreadsheet: FileSpreadsheet,
  drafting: DraftingCompass,

  // LOGÍSTICA

  calendar: Calendar,
  clock: Clock,
  cable: Cable,
  gauge: Gauge,
  settings: Settings,

  // ESTADOS

  circle: Circle,
  check: Check,
  play: Play,
  pause: Pause,
  stop: StopCircle,

  urgent: AlertTriangle,
  high: ChevronUp,
  medium: Minus,
  low: ChevronDown,

  // VARIOS

  pencil: Pencil,
  bolt: Bolt,
  energy: Zap,
  cog: Cog,
  pickaxe: Pickaxe,
  save: Save,
  hash: Hash,

} satisfies Record<string, LucideIcon>

export type EntityIcon = keyof typeof ENTITY_ICONS

export const ENTITY_ICON_OPTIONS = Object.entries(ENTITY_ICONS).map(
  ([id, icon]) => ({
    id: id as EntityIcon,
    icon,
  }),
)