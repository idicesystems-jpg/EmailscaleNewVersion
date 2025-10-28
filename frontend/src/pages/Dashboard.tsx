import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { OnboardingWalkthrough } from "../components/OnboardingWalkthrough";
import { useImpersonation } from "@/hooks/useImpersonation";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  Mail,
  Flame,
  Globe,
  Activity,
  Target,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Package,
  Ticket,
  Clock,
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  useNotificationsUnreadCountQuery,
  useNotificationsByEmailQuery,
  useMarkNotificationsReadMutation,
} from "../services/ticketService";

import { useCheckOnboardingMutation, useCompleteOnboardingMutation } from "@/services/authService";

const Dashboard = () => {
  const { impersonatedUserId } = useImpersonation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    domains: 0,
    inboxes: 0,
    warmupAccounts: 0,
    emailsSent: 0,
  });
  const [profile, setProfile] = useState<any>(null);

  const { user, token, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );



  // For getting unread count
  const { data: unreadCount } = useNotificationsUnreadCountQuery(user.email);

  // For getting all notifications
  const { data: notifications } = useNotificationsByEmailQuery(user.email);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkOnboarding();
    // Set up realtime listeners
    const actualUser = user;
  }, [impersonatedUserId]);


  const [checkOnboardingApi] = useCheckOnboardingMutation();
  const [completeOnboardingApi] = useCompleteOnboardingMutation();
  const checkOnboarding = async () => {
    try {
      if (!user) return;

      const userId = user.id;

      const res = await checkOnboardingApi({user_id: userId}).unwrap();

      if (res?.showOnboarding) {
      setShowOnboarding(true);
    }

      // const { data: preferences } = await supabase
      //   .from('user_preferences')
      //   .select('onboarding_completed')
      //   .eq('user_id', user.id)
      //   .single();

      //if (!preferences) {
        // First time user - show onboarding
       // setShowOnboarding(true);
        // Create preferences record
        // await supabase
        //   .from('user_preferences')
        //   .insert({ user_id: user.id, onboarding_completed: false });
      // } else if (!preferences.onboarding_completed) {
      //   setShowOnboarding(true);
      // }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      //const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
       const userId = user.id;

      // await supabase
      //   .from('user_preferences')
      //   .update({ onboarding_completed: true })
      //   .eq('user_id', user.id);
      await completeOnboardingApi({user_id: userId}).unwrap();
      setShowOnboarding(false);
      // toast.success("Welcome aboard!", {
      //   description: "You're all set. Let's get started!",
      // });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };
  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Get the user ID to use (impersonated or actual)
    const actualUser = (await supabase.auth.getUser()).data.user;
    const userId = impersonatedUserId || actualUser?.id;
    
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setProfile(profileData);

    // Fetch counts
    const [domainsRes, inboxesRes, warmupRes, emailsRes] = await Promise.all([
      supabase.from('domains').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('inboxes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('warmup_accounts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('email_sends').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    setStats({
      domains: domainsRes.count || 0,
      inboxes: inboxesRes.count || 0,
      warmupAccounts: warmupRes.count || 0,
      emailsSent: emailsRes.count || 0,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <OnboardingWalkthrough
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to EmailScale - Manage your email operations
          </p>
        </div>

        {/* Account & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Domains
              </CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.domains}/100
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Package: {profile?.subscription_plan || "starter"} (£
                {profile?.subscription_plan === "unlimited"
                  ? "299"
                  : profile?.subscription_plan === "professional"
                  ? "99"
                  : "69"}
                /mo)
              </p>
              <Progress
                value={(stats.domains / 100) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Mailboxes
              </CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.inboxes}
              </div>
              <p className="text-xs text-primary flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active mailboxes
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Warmup Progress
              </CardTitle>
              <Flame className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.warmupAccounts > 0 ? "87%" : "0%"}
              </div>
              <Progress
                value={stats.warmupAccounts > 0 ? 87 : 0}
                className="mt-2 h-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.warmupAccounts} warmup accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Warmup Health
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Excellent</div>
              <p className="text-xs text-muted-foreground mt-1">
                98.5% health score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Emails Sent
                </CardTitle>
                <Send className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.emailsSent}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Delivered
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">12,201</div>
                <p className="text-xs text-muted-foreground mt-1">
                  97.9% success rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bounced
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">134</div>
                <p className="text-xs text-muted-foreground mt-1">
                  1.1% bounce rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Spam
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">123</div>
                <p className="text-xs text-muted-foreground mt-1">
                  1.0% spam rate
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center p-3 bg-secondary/50 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer">
                <Mail className="h-5 w-5 text-primary mr-3" />
                <span className="text-foreground">Order New Inbox</span>
              </div>
              <div className="flex items-center p-3 bg-secondary/50 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer">
                <Flame className="h-5 w-5 text-primary mr-3" />
                <span className="text-foreground">Start Email Warmup</span>
              </div>
              <div className="flex items-center p-3 bg-secondary/50 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer">
                <Target className="h-5 w-5 text-primary mr-3" />
                <span className="text-foreground">Run Placement Test</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start p-3 bg-secondary/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Email verification completed
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-secondary/50 rounded-lg">
                <Flame className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Warmup campaign updated
                  </p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-secondary/50 rounded-lg">
                <Globe className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    New domain added
                  </p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Ticket Notifications */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-foreground">
                  <Ticket className="h-5 w-5 mr-2 text-primary" />
                  Support Ticket Notifications
                </CardTitle>
                <CardDescription>
                  Recent updates on your support tickets
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <span className="text-xs font-medium text-primary">
                  {unreadCount?.count} Active
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {notifications?.notifications?.map((noty, index) => (
              <div className="flex items-start p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        Email Warmup {noty.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ticket #{noty.id}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground ml-4">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(noty.created_at).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {noty.message}
                  </p>
                </div>
              </div>
            ))}

            {/* <div className="flex items-start p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground font-medium">Domain Connection Problem</p>
                    <p className="text-xs text-muted-foreground mt-1">Ticket #1235 - In Progress</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground ml-4">
                    <Clock className="h-3 w-3 mr-1" />
                    5h ago
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Our team is investigating your domain connection issue. We'll update you shortly.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground font-medium">Billing Question</p>
                    <p className="text-xs text-muted-foreground mt-1">Ticket #1236 - Waiting for Response</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground ml-4">
                    <Clock className="h-3 w-3 mr-1" />
                    1d ago
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  We need additional information to process your billing inquiry. Please check your email.
                </p>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
