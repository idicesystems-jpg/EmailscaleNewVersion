import { ReactNode } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import emailScaleLogo from "@/assets/emailscale-logo.png";
import { 
  LayoutDashboard, 
  Users, 
  Flame, 
  LogOut,
  Mail,
  Globe,
  LifeBuoy,
  Server,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/domains", icon: Globe, label: "Domains" },
    { path: "/admin/inboxes", icon: Mail, label: "Inboxes" },
    { path: "/admin/warmups", icon: Flame, label: "Warmup Accounts" },
    { path: "/admin/server-monitoring", icon: Server, label: "Server Monitoring" },
    { path: "/admin/support", icon: LifeBuoy, label: "Support Tickets" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card relative flex flex-col">
        <div className="p-3 border-b border-border flex items-center">
          <img src={emailScaleLogo} alt="EmailScale" className="h-7 w-auto" />
        </div>
        
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">System Management</p>
        </div>
        
        <nav className="px-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
