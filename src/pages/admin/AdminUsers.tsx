import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, UserPlus, Lock, Unlock, Key, Pause, Play, CreditCard, Eye, Search } from "lucide-react";
import { useImpersonation } from "@/hooks/useImpersonation";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { setImpersonation } = useImpersonation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error fetching users");
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user && formData.phone) {
      await supabase
        .from('profiles')
        .update({ phone: formData.phone })
        .eq('id', data.user.id);
    }

    toast.success("User created successfully");
    setDialogOpen(false);
    setFormData({ email: "", password: "", full_name: "", phone: "" });
    fetchUsers();
  };

  const handleViewAsUser = (userId: string, email: string) => {
    setImpersonation(userId, email);
    navigate("/dashboard");
    toast.success(`Now viewing as ${email}`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      toast.error("Error deleting user");
      console.error(error);
    } else {
      toast.success("User deleted successfully");
      fetchUsers();
    }
  };

  const handleToggleLock = async (userId: string, currentlyLocked: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_locked: !currentlyLocked })
      .eq('id', userId);

    if (error) {
      toast.error("Error updating account lock status");
    } else {
      toast.success(`Account ${!currentlyLocked ? 'locked' : 'unlocked'} successfully`);
      fetchUsers();
    }
  };

  const handleTogglePause = async (userId: string, currentlyPaused: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_paused: !currentlyPaused })
      .eq('id', userId);

    if (error) {
      toast.error("Error updating account pause status");
    } else {
      toast.success(`Account ${!currentlyPaused ? 'paused' : 'resumed'} successfully`);
      fetchUsers();
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;

    const { error } = await supabase.auth.admin.updateUserById(
      selectedUser.id,
      { password: newPassword }
    );

    if (error) {
      toast.error("Error changing password");
    } else {
      toast.success("Password changed successfully");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    }
  };

  const handleUpdateSubscription = async (plan: string) => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_plan: plan,
        subscription_status: 'active'
      })
      .eq('id', selectedUser.id);

    if (error) {
      toast.error("Error updating subscription");
    } else {
      toast.success(`Subscription updated to ${plan}`);
      setSubscriptionDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage all system users</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Create User</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {users.filter(u => !u.account_locked && !u.account_paused).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Locked Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {users.filter(u => u.account_locked).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Paused Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {users.filter(u => u.account_paused).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                {searchQuery ? "No users found matching your search" : "No users found"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stripe</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={user.account_locked ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.subscription_plan === 'unlimited' ? 'bg-purple-500/20 text-purple-500' :
                            user.subscription_plan === 'professional' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {user.subscription_plan || 'starter'}
                          </span>
                          {user.account_paused && (
                            <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-500">
                              Paused
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.account_locked ? 'bg-red-500/20 text-red-500' :
                          user.subscription_status === 'active' ? 'bg-green-500/20 text-green-500' :
                          'bg-orange-500/20 text-orange-500'
                        }`}>
                          {user.account_locked ? 'Locked' : user.subscription_status || 'active'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {user.stripe_customer_id ? (
                            <>
                              <div className="truncate max-w-[100px]" title={user.stripe_customer_id}>
                                {user.stripe_customer_id}
                              </div>
                              {user.next_billing_date && (
                                <div className="text-muted-foreground">
                                  Next: {new Date(user.next_billing_date).toLocaleDateString()}
                                </div>
                              )}
                            </>
                          ) : '—'}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAsUser(user.id, user.email)}
                            title="View as User"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleLock(user.id, user.account_locked)}
                            title={user.account_locked ? "Unlock account" : "Lock account"}
                          >
                            {user.account_locked ? (
                              <Unlock className="h-4 w-4 text-green-500" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePause(user.id, user.account_paused)}
                            title={user.account_paused ? "Resume account" : "Pause account"}
                          >
                            {user.account_paused ? (
                              <Play className="h-4 w-4 text-green-500" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setPasswordDialogOpen(true);
                            }}
                            title="Change password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setSubscriptionDialogOpen(true);
                            }}
                            title="Manage subscription"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <Button onClick={handleChangePassword} className="w-full">
                Change Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subscription Management Dialog */}
        <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Subscription</DialogTitle>
              <DialogDescription>
                Change subscription plan for {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Plan: <span className="font-semibold">{selectedUser?.subscription_plan || 'starter'}</span></Label>
              </div>
              <div className="grid gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateSubscription('starter')}
                  className="justify-start h-auto py-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Starter Plan - £69/mo</div>
                    <div className="text-sm text-muted-foreground">30 inboxes</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateSubscription('professional')}
                  className="justify-start h-auto py-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Professional Plan - £99/mo</div>
                    <div className="text-sm text-muted-foreground">100 inboxes</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateSubscription('unlimited')}
                  className="justify-start h-auto py-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Unlimited Plan - £299/mo</div>
                    <div className="text-sm text-muted-foreground">Unlimited inboxes</div>
                  </div>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
