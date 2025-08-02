import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  Calendar, 
  BarChart3, 
  Settings,
  Search,
  Bell
} from 'lucide-react'

const navigationItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
  },
  {
    title: 'Projects',
    icon: FolderOpen,
    url: '/dashboard/projects',
  },
  {
    title: 'Clients',
    icon: Users,
    url: '/dashboard/clients',
  },
  {
    title: 'Calendar',
    icon: Calendar,
    url: '/dashboard/calendar',
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    url: '/dashboard/analytics',
  },
]

const toolsItems = [
  {
    title: 'Search',
    icon: Search,
    url: '/dashboard/search',
  },
  {
    title: 'Notifications',
    icon: Bell,
    url: '/dashboard/notifications',
  },
  {
    title: 'Settings',
    icon: Settings,
    url: '/dashboard/settings',
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="font-semibold">Idara Business</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">
          Modern Business Dashboard
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}