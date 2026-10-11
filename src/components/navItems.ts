import {
  Brain,
  Car,
  FileText,
  Flame,
  LayoutDashboard,
  Landmark,
  Map,
  ShieldAlert,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import type { AppView } from '../types'

export interface NavItem {
  id: AppView
  label: string
  icon: LucideIcon
}

/** Single source of truth for the app's primary destinations. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Crime Map', icon: Map },
  { id: 'hotspots', label: 'Risk Zones', icon: Flame },
  { id: 'trends', label: 'Crime Trends', icon: TrendingUp },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'predictive-risk', label: 'Risk Forecast', icon: ShieldAlert },
  { id: 'patrol', label: 'Patrol Simulation', icon: Car },
  { id: 'stations', label: 'Police Stations', icon: Landmark },
  { id: 'reports', label: 'Reports', icon: FileText },
]
