import {
  Home, Users, Briefcase, FileText, Settings, ShieldCheck, Shield,
  BarChart3, CreditCard, Building2, Building, Truck, FolderOpen,
  ClipboardList, Calendar, Bell, HardHat, Package, Layers,
  LayoutDashboard, FilePlus, AlertTriangle, Landmark, Circle,
  DollarSign, UserCheck, UserPlus, FileSearch, FileCheck,
  BarChart, BarChart2, PieChart, LineChart, TrendingUp,
  Mail, MessageSquare, Send, Inbox, Archive,
  MapPin, Globe, Navigation, Compass,
  Lock, Key, Eye, EyeOff, ShieldAlert,
  Wrench, Hammer, Cog, SlidersHorizontal,
  Box, Boxes, Warehouse, Tag, Tags,
  Clock, Timer, History, AlarmClock,
  Heart, Star, Bookmark, Flag,
  CheckCircle, CheckSquare, XCircle, AlertCircle, Info,
  Plus, Minus, Search, Filter, RefreshCw,
  Upload, Download, ExternalLink, Link2,
  ChevronRight, ChevronDown, ArrowRight, ArrowLeft,
  Clipboard, ClipboardCheck, ListChecks, List,
  Table, Grid3x3, LayoutGrid,
  Receipt, Banknote, Wallet, PiggyBank,
  GraduationCap, BookOpen, Library,
  Stethoscope, Pill, Activity,
  Car, Plane, Ship, Train,
  Zap, Bolt, Power, Battery,
  Cloud, Sun, Moon, Snowflake,
  Camera, Image, Film, Video,
  Phone, Smartphone, Monitor, Laptop,
  Wifi, Signal, Radio,
  GitBranch, GitCommit, GitMerge, GitPullRequest,
  Database, Server, HardDrive, Cpu,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps Lucide kebab-case icon names (as used in spec YAML) to components.
 * Keys are the exact kebab-case names from lucide-react.
 */
const iconMap: Record<string, LucideIcon> = {
  // Layout & Dashboard
  'home': Home,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'grid-3x3': Grid3x3,
  'table': Table,

  // Users & People
  'users': Users,
  'user-check': UserCheck,
  'user-plus': UserPlus,

  // Files & Documents
  'file-text': FileText,
  'file-plus': FilePlus,
  'file-search': FileSearch,
  'file-check': FileCheck,
  'folder-open': FolderOpen,

  // Business
  'briefcase': Briefcase,
  'building': Building,
  'building-2': Building2,
  'landmark': Landmark,
  'receipt': Receipt,
  'banknote': Banknote,
  'wallet': Wallet,
  'piggy-bank': PiggyBank,

  // Finance & Payments
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,

  // Security & Auth
  'shield': Shield,
  'shield-check': ShieldCheck,
  'shield-alert': ShieldAlert,
  'lock': Lock,
  'key': Key,
  'eye': Eye,
  'eye-off': EyeOff,

  // Charts & Analytics
  'bar-chart': BarChart,
  'bar-chart-2': BarChart2,
  'bar-chart-3': BarChart3,
  'pie-chart': PieChart,
  'line-chart': LineChart,
  'trending-up': TrendingUp,

  // Communication
  'bell': Bell,
  'mail': Mail,
  'message-square': MessageSquare,
  'send': Send,
  'inbox': Inbox,
  'archive': Archive,

  // Navigation & Location
  'map-pin': MapPin,
  'globe': Globe,
  'navigation': Navigation,
  'compass': Compass,

  // Settings & Tools
  'settings': Settings,
  'wrench': Wrench,
  'hammer': Hammer,
  'cog': Cog,
  'sliders-horizontal': SlidersHorizontal,

  // Alerts & Status
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  'check-square': CheckSquare,
  'x-circle': XCircle,
  'info': Info,

  // Packaging & Inventory
  'box': Box,
  'boxes': Boxes,
  'package': Package,
  'warehouse': Warehouse,
  'layers': Layers,
  'tag': Tag,
  'tags': Tags,

  // Time
  'calendar': Calendar,
  'clock': Clock,
  'timer': Timer,
  'history': History,
  'alarm-clock': AlarmClock,

  // Actions
  'plus': Plus,
  'minus': Minus,
  'search': Search,
  'filter': Filter,
  'refresh-cw': RefreshCw,
  'upload': Upload,
  'download': Download,
  'external-link': ExternalLink,
  'link-2': Link2,

  // Arrows
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,

  // Lists & Clipboard
  'clipboard': Clipboard,
  'clipboard-check': ClipboardCheck,
  'clipboard-list': ClipboardList,
  'list-checks': ListChecks,
  'list': List,

  // Favorites
  'heart': Heart,
  'star': Star,
  'bookmark': Bookmark,
  'flag': Flag,

  // Transport
  'truck': Truck,
  'car': Car,
  'plane': Plane,
  'ship': Ship,
  'train': Train,

  // Construction
  'hard-hat': HardHat,

  // Education & Health
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'library': Library,
  'stethoscope': Stethoscope,
  'pill': Pill,
  'activity': Activity,

  // Tech
  'database': Database,
  'server': Server,
  'hard-drive': HardDrive,
  'cpu': Cpu,
  'git-branch': GitBranch,
  'git-commit': GitCommit,
  'git-merge': GitMerge,
  'git-pull-request': GitPullRequest,

  // Shapes
  'circle': Circle,

  // Energy
  'zap': Zap,
  'power': Power,
  'battery': Battery,

  // Weather
  'cloud': Cloud,
  'sun': Sun,
  'moon': Moon,

  // Media
  'camera': Camera,
  'image': Image,
  'film': Film,
  'video': Video,

  // Devices
  'phone': Phone,
  'smartphone': Smartphone,
  'monitor': Monitor,
  'laptop': Laptop,
  'wifi': Wifi,
  'signal': Signal,
  'radio': Radio,
};

export function getNavIcon(iconName: string | undefined): LucideIcon | null {
  if (!iconName) return null;
  // Direct kebab-case lookup (primary — matches spec YAML values)
  if (iconMap[iconName]) return iconMap[iconName];
  // Lowercase fallback
  const lower = iconName.toLowerCase();
  if (iconMap[lower]) return iconMap[lower];
  return null;
}
