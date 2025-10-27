import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, User, Lock, Phone, Mail, Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import {useUpdateUserMutation} from "../services/authService";

const Settings = () => {
  const navigate = useNavigate();
   const { user, token, isAuthenticated } = useSelector(
      (state: any) => state.auth
    );
  console.log("user", user);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    id:user?.id || "",
    fname: user?.fname || "",
    lname: user?.lname || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  console.log("profile", profile);

  // useEffect(() => {
  //   loadProfile();
  // }, []);

  // const loadProfile = async () => {
  //   setLoading(true);
  //   const { data: { user } } = await supabase.auth.getUser();
    
  //   // if (!user) {
  //   //   navigate("/auth");
  //   //   return;
  //   // }

  //   const { data, error } = await supabase
  //     .from('profiles')
  //     .select('*')
  //     .eq('id', user.id)
  //     .single();

  //   if (error) {
  //     console.error('Error loading profile:', error);
  //     toast.error('Failed to load profile');
  //   } else if (data) {
  //     setProfile({
  //       full_name: data.full_name || '',
  //       email: data.email || '',
  //       phone: data.phone || '',
  //     });
  //   }
  //   setLoading(false);
  // };

  const [updateUser] = useUpdateUserMutation();

  const handleSaveProfile = async () => {
     try {
          await updateUser(profile).unwrap();
          toast.success("Profile updated successfully");
        } catch (err) {
          toast.error("Failed to create domain");
          console.error(err);
        }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Stripe Subscription Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              Subscription
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Professional Plan</p>
                <p className="text-sm text-muted-foreground">£99/month • 100 inboxes</p>
                <p className="text-xs text-muted-foreground mt-1">Next billing date: April 15, 2025</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setChangePlanOpen(true)}>Change Plan</Button>
                <Button variant="destructive" size="sm">Cancel</Button>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="outline" className="w-full">Update Payment Method</Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <User className="h-5 w-5 mr-2 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) :  */}
            {(
              <>
                <div className="space-y-2">
                  <Label htmlFor="fname">First Name</Label>
                  <Input 
                    id="fname" 
                    placeholder="John Doe" 
                    value={profile.fname}
                    onChange={(e) => setProfile({ ...profile, fname: e.target.value })}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="fname">Last Name</Label>
                  <Input 
                    id="lname" 
                    placeholder="John Doe" 
                    value={profile.lname}
                    onChange={(e) => setProfile({ ...profile, lname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+1 (555) 123-4567" 
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Lock className="h-5 w-5 mr-2 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full">Update Password</Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Support Ticket Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about support ticket responses</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Billing Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive billing and payment notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive product updates and newsletters</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
            <DialogDescription>
              Choose the plan that best fits your needs
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Card className="border-2 border-border hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Starter Plan</CardTitle>
                    <CardDescription>Perfect for small teams</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">£69</p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">30 inboxes included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Email warmup included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Basic support</span>
                </div>
                <Button className="w-full mt-4" variant="outline">Downgrade to Starter</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Professional Plan</CardTitle>
                    <CardDescription>For growing businesses</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">£99</p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">100 inboxes included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Advanced email warmup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Advanced analytics</span>
                </div>
                <Button className="w-full mt-4">Current Plan</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-primary transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Unlimited Plan</CardTitle>
                    <CardDescription>For power users and agencies</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">£299</p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Unlimited inboxes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Premium email warmup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">24/7 Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Dedicated account manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">White-label options</span>
                </div>
                <Button className="w-full mt-4" variant="outline">Upgrade to Unlimited</Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;