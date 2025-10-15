import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Globe, Mail, Activity, Send, Target, Ticket, Clock, Search, Server } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDomains: 0,
    totalInboxes: 0,
    avgHealthScore: 0,
    totalEmailSends: 0,
    inboxPlacement: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [serverStatus, setServerStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchTickets();
    fetchServerStatus();
  }, []);

  const fetchStats = async () => {
    const [
      { count: usersCount },
      { count: domainsCount },
      { count: inboxesCount },
      { data: inboxesData },
      { count: sendsCount },
      { data: sendsData }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('domains').select('*', { count: 'exact', head: true }),
      supabase.from('inboxes').select('*', { count: 'exact', head: true }),
      supabase.from('inboxes').select('health_score'),
      supabase.from('email_sends').select('*', { count: 'exact', head: true }),
      supabase.from('email_sends').select('placement'),
    ]);

    const avgHealth = inboxesData?.reduce((acc, curr) => acc + (Number(curr.health_score) || 0), 0) / (inboxesData?.length || 1);
    const inboxCount = sendsData?.filter(s => s.placement === 'inbox').length || 0;
    const placementRate = ((inboxCount / (sendsData?.length || 1)) * 100);

    setStats({
      totalUsers: usersCount || 0,
      totalDomains: domainsCount || 0,
      totalInboxes: inboxesCount || 0,
      avgHealthScore: Math.round(avgHealth || 0),
      totalEmailSends: sendsCount || 0,
      inboxPlacement: Math.round(placementRate || 0),
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, last_login, last_active_at, created_at')
      .order('last_login', { ascending: false, nullsFirst: false });
    
    setUsers(data || []);
  };

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setTickets(data || []);
  };

  const fetchServerStatus = async () => {
    // Check recent blacklist checks (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const [
      { data: blacklistData },
      { data: complaintData },
      { data: monitoredIPs }
    ] = await Promise.all([
      supabase
        .from('ip_blacklist_checks')
        .select('*')
        .gte('checked_at', sevenDaysAgo),
      supabase
        .from('spam_complaints')
        .select('*')
        .eq('resolved', false),
      supabase
        .from('monitored_ips')
        .select('*')
        .eq('status', 'active')
    ]);

    // Calculate critical issues
    const blacklistedIPs = blacklistData?.filter(check => check.is_blacklisted).length || 0;
    const unresolvedComplaints = complaintData?.length || 0;
    const activeIPs = monitoredIPs?.length || 0;
    
    // Determine status
    if (blacklistedIPs >= 3 || unresolvedComplaints >= 5) {
      setServerStatus('critical');
    } else if (blacklistedIPs > 0 || unresolvedComplaints > 0 || activeIPs === 0) {
      setServerStatus('warning');
    } else {
      setServerStatus('healthy');
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    // In a real implementation, you would switch to viewing that user's account
    navigate(`/admin/users`);
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and statistics</p>
          </div>
          <Badge 
            variant={serverStatus === 'healthy' ? 'default' : 'destructive'}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${
              serverStatus === 'healthy' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500' :
              serverStatus === 'warning' ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500' :
              'bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500'
            }`}
          >
            <Server className="h-4 w-4" />
            <span className="font-semibold">
              {serverStatus === 'healthy' ? 'Server Healthy' :
               serverStatus === 'warning' ? 'Server Unstable' :
               'Server Issues'}
            </span>
            <div className={`h-2 w-2 rounded-full ${
              serverStatus === 'healthy' ? 'bg-green-500 animate-pulse' :
              serverStatus === 'warning' ? 'bg-orange-500 animate-pulse' :
              'bg-red-500 animate-pulse'
            }`} />
          </Badge>
        </div>

        {/* User Account Selector */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Switch to User Account</CardTitle>
            <CardDescription>View and manage any user's account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedUser} onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user account..." />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Domains
              </CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalDomains}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Inboxes
              </CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalInboxes}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Health Score
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.avgHealthScore}%</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Email Sends
              </CardTitle>
              <Send className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalEmailSends.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inbox Placement
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.inboxPlacement}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent User Activity */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-foreground">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Recent User Activity
                </CardTitle>
                <CardDescription>Users by last login time</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No user activity yet</p>
            ) : (
              <div className="space-y-3">
                {users.slice(0, 10).map((user) => {
                  const lastLogin = user.last_login ? new Date(user.last_login) : null;
                  const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
                  const isRecentlyActive = lastActive && (Date.now() - lastActive.getTime()) < 30 * 60 * 1000; // 30 minutes
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-secondary/20 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${isRecentlyActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.full_name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {lastLogin ? (
                          <>
                            <p className="text-xs text-foreground">
                              Last login: {lastLogin.toLocaleDateString()} {lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {lastActive && (
                              <p className="text-xs text-muted-foreground">
                                Active: {lastActive.toLocaleDateString()} {lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">Never logged in</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-foreground">
                  <Ticket className="h-5 w-5 mr-2 text-primary" />
                  Recent Support Tickets
                </CardTitle>
                <CardDescription>Latest support requests from users</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No support tickets yet</p>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start p-4 bg-secondary/20 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-foreground font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          #{ticket.ticket_number} - {ticket.profiles?.full_name || ticket.profiles?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          ticket.status === 'open' ? 'bg-orange-500/20 text-orange-500' :
                          ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-green-500/20 text-green-500'
                        }`}>
                          {ticket.status}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
