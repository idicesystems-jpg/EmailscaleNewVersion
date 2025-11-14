import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionData {
  subscribed: boolean;
  product_id?: string;
  tier_name?: string;
  tier_price?: string;
  price_id?: string;
  subscription_end?: string;
  subscription_id?: string;
  loading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    loading: true
  });

  const checkSubscription = useCallback(async () => {
    try {
      if (!user) {
        setSubscription({ subscribed: false, loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ subscribed: false, loading: false });
        return;
      }

      setSubscription({
        ...data,
        loading: false
      });
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      setSubscription({ subscribed: false, loading: false });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSubscription({ subscribed: false, loading: false });
      return;
    }

    checkSubscription();
    
    // Check subscription every 30 seconds
    const interval = setInterval(checkSubscription, 30000);
    
    // Set up realtime subscription to detect manual access changes
    const channel = supabase
      .channel(`profile-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated, refreshing subscription status');
          checkSubscription();
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id, checkSubscription]);

  const refresh = () => {
    checkSubscription();
  };

  return { 
    ...subscription,
    refresh
  };
};