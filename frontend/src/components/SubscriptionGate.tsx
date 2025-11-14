import { useSubscription } from "@/hooks/useSubscription";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const subscription = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const navigate = useNavigate();

  if (subscription.loading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow admins to bypass subscription check
  if (isAdmin) {
    return <>{children}</>;
  }

//   if (!subscription.subscribed) {
if (subscription.subscribed) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md w-full border-border">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Subscription Required</CardTitle>
            <CardDescription className="text-base">
              You need an active subscription to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Subscribe to one of our plans to unlock all EmailScale features including email warmup, inbox management, and advanced analytics.
            </p>
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={() => navigate('/dashboard/settings')}
            >
              <CreditCard className="h-4 w-4" />
              View Subscription Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};