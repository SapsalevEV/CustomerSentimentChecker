import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  BarChart3,
  AlertTriangle,
  CheckSquare,
  FileText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Обзор", url: "/", icon: LayoutDashboard },
  { title: "Продукты", url: "/products", icon: Package },
  { title: "География", url: "/geography", icon: MapPin },
  { title: "Клиенты", url: "/customers", icon: Users },
  { title: "Аналитика", url: "/analytics", icon: BarChart3 },
  { title: "Инциденты", url: "/incidents", icon: AlertTriangle },
  { title: "Действия", url: "/actions", icon: CheckSquare },
  { title: "Отчеты", url: "/reports", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">Pulse</h2>
                <p className="text-xs text-sidebar-foreground/70">Аналитическая платформа</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {!isCollapsed && "Навигация"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses}>
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}