import { ReactNode,useState,useEffect} from "react";
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
  Settings,
  UserCog
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { useAdminRole } from "@/hooks/useAdminRole";
import { useImpersonation } from "@/hooks/useImpersonation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useDispatch } from "react-redux";
import { logout } from "../services/authSlice";

import { useAllUsersQuery } from "../services/adminUserService";
import { useSelector } from "react-redux";


interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
   const { user, token, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { adminRole, loading, isAdmin } = useAdminRole();

  const { impersonatedUserId, impersonatedUserEmail, setImpersonation, clearImpersonation } = useImpersonation();

  const { data , isLoading } = useAllUsersQuery();
  const allUsers = data?.users || [];

  const currentUserId = user.id || null ;

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Access denied - Admin access required");
      navigate("/dashboard");
    }
  }, [isAdmin, loading, navigate]);

   const handleUserSwitch = async (userId: string) => {
    const user = allUsers?.find((u) => u.id === userId);
    if (!user) return;
    
      if (userId === currentUserId) {
        clearImpersonation();
        toast.success("Viewing as yourself");
        navigate("/admin");
      } else {
        //clearImpersonation();
        await  setImpersonation(userId, user.email);
        toast.success(`Now viewing as ${user.fname || user.email}`);
        navigate("/dashboard");
      }
    
  };

  const handleLogout = async () => {
    //await supabase.auth.signOut();
    // Clear auth state
    dispatch(logout());
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

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

        
      {/* User Impersonation Selector (Admins Only) */}
        {isAdmin && allUsers?.length > 0 && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCog className="h-4 w-4" />
              <span className="font-medium">View as Client</span>
            </div>

            <Select
              value={impersonatedUserId || currentUserId}
              onValueChange={handleUserSwitch}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {allUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                    {user.id === currentUserId && " (You)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {impersonatedUserId && (
              <Badge
                variant="secondary"
                className="w-full justify-center text-xs"
              >
                Viewing as: {impersonatedUserEmail}
              </Badge>
            )}
          </div>
        )}
        
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
