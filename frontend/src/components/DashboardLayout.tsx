import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useImpersonation } from "@/hooks/useImpersonation";
import emailScaleLogo from "@/assets/emailscale-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Mail,
  Flame,
  TestTube,
  CheckCircle,
  Link as LinkIcon,
  HelpCircle,
  Settings,
  LogOut,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inbox Ordering", url: "/dashboard/inbox-ordering", icon: Mail },
  { title: "Email Warmup", url: "/dashboard/warmup", icon: Flame },
  { title: "Email Verification", url: "/dashboard/verification", icon: CheckCircle },
  { title: "Integrations", url: "/dashboard/integrations", icon: LinkIcon },
  { title: "Support", url: "/dashboard/support", icon: HelpCircle },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { impersonatedUserEmail, clearImpersonation } = useImpersonation();

  const handleLogout = () => {
    navigate("/auth");
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary/20 text-primary font-medium border-l-2 border-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-3 border-b border-border flex items-center">
          {state !== "collapsed" ? (
            <img src={emailScaleLogo} alt="EmailScale" className="h-7 w-auto" />
          ) : (
            <img src={emailScaleLogo} alt="EmailScale" className="h-5 w-auto" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border space-y-2">
          {impersonatedUserEmail && (
            <Button
              variant="ghost"
              className="w-full justify-start text-primary hover:text-primary font-medium"
              onClick={() => {
                clearImpersonation();
                navigate("/admin");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              {state !== "collapsed" && <span className="ml-2">Back to Admin</span>}
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/admin")}
          >
            <ShieldCheck className="h-4 w-4" />
            {state !== "collapsed" && <span className="ml-2">Admin</span>}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {state !== "collapsed" && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { impersonatedUserEmail } = useImpersonation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <SidebarTrigger />
            {impersonatedUserEmail && (
              <div className="ml-4 px-3 py-1 bg-primary/20 text-primary rounded-md text-sm font-medium">
                Viewing as: {impersonatedUserEmail}
              </div>
            )}
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
