import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { toast } from "sonner";
import {
  Trash2,
  UserPlus,
  Lock,
  Unlock,
  Key,
  Pause,
  Play,
  CreditCard,
  Eye,
  Search,
  Edit,
  Shield,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useImpersonation } from "@/hooks/useImpersonation";
import { useNavigate } from "react-router-dom";

import {
  useFetchUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useToggleLockMutation,
  useTogglePauseMutation,
  useChangePasswordMutation,
  useUpdateSubscriptionMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useLazyExportUsersCsvQuery,
} from "../../services/adminUserService";
import Pagination from "../../components/Pagination";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { setImpersonation } = useImpersonation();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [newPassword, setNewPassword] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());


  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (!error && data) {
      const rolesMap: Record<string, string[]> = {};
      data.forEach((item) => {
        if (!rolesMap[item.user_id]) {
          rolesMap[item.user_id] = [];
        }
        rolesMap[item.user_id].push(item.role);
      });
      setUserRoles(rolesMap);
    }
  };

  const [editForm, setEditForm] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  //fetch users code
  const { data, error, isLoading } = useFetchUsersQuery({
    page,
    limit,
    search,
  });

  const users = data?.users || [];

  console.log("Fetched users:", users || []);

  //fetch users code

  //add user code
  // Define type for errors
  interface FormErrors {
    fname?: string;
    lname?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    password?: string;
    password_confirmation?: string;
    status?: string;
    amount?: string;
    ghl_tool?: string;
    // Remove duplicate and fix interface
  }

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    company_name: "",
    password: "",
    password_confirmation: "",
    email_tool: false,
    domains_tool: false,
    warm_up_tool: false,
    ghl_tool: false,
    amount: 0,
    status: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.fname.trim()) newErrors.fname = "First Name is required";
    if (!formData.lname.trim()) newErrors.lname = "Last Name is required";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone number must be 10 digits";

    if (!formData.company_name.trim())
      newErrors.company_name = "Company Name is required";

    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.password_confirmation)
      newErrors.password_confirmation = "Confirm Password is required";
    else if (formData.password !== formData.password_confirmation)
      newErrors.password_confirmation = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      await createUser({
        ...formData,
        email_tool: formData.email_tool ? 1 : 0,
        domains_tool: formData.domains_tool ? 1 : 0,
        warm_up_tool: formData.warm_up_tool ? 1 : 0,
      }).unwrap();

      toast.success("User created successfully");
      setDialogOpen(false);
      setFormData({
        fname: "",
        lname: "",
        email: "",
        phone: "",
        company_name: "",
        password: "",
        password_confirmation: "",
        email_tool: false,
        domains_tool: false,
        warm_up_tool: false,
        ghl_tool: false,
        amount: 0,
        status: "",
      });
    } catch (err: any) {
      toast.error(err.data?.message || "Error creating user");
    }
  };

  ///add user code

  // Function to handle edit click and populate form with user data
  const handleEditClick = (user: any) => {
    setFormData({
      fname: user.fname || "",
      lname: user.lname || "",
      email: user.email || "",
      phone: user.phone || "",
      company_name: user.company_name || "",
      password: "",
      password_confirmation: "",
      email_tool: user.email_tool || false,
      domains_tool: user.domains_tool || false,
      warm_up_tool: user.warm_up_tool || false,
      ghl_tool: user.ghl_tool || false,
      amount: user.amount || 0,
      status: user.status || "",
    });
    setSelectedUser(user);
    setEditForm(true);
  };

  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const handleUpdateUser = async () => {
    try {
      await updateUser({ userId: selectedUser.id, ...formData }).unwrap();
      toast.success("User updated successfully!");
      setEditForm(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user");
    }
  };

  //update user code

  //update status code
  const [updateUserStatus, { isLoading: isUpdating }] =
    useUpdateUserStatusMutation();
  const handleToggleUserStatusPause = async (userId, isPaused) => {
    try {
      // Toggle pause status
      const newStatus = !isPaused;

      await updateUserStatus({
        userId,
        status: newStatus, // 👈 backend expects 'status'
      }).unwrap();

      toast.success(
        newStatus ? "User account paused successfully" : "User account resumed"
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  //update status code

  //delete user code
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const result = await deleteUser(userId).unwrap();
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    }
  };
  //delete user code

  //export user code
  const [triggerExportCsv] = useLazyExportUsersCsvQuery();
  const handleExportCsv = async () => {
    try {
      await triggerExportCsv().unwrap();
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export CSV");
    }
  };
  //export user code

  const handleViewAsUser = (userId: string, email: string) => {
    setImpersonation(userId, email);
    navigate("/dashboard");
    toast.success(`Now viewing as ${email}`);
  };

  const handleToggleLock = async (userId: string, currentlyLocked: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_locked: !currentlyLocked })
      .eq("id", userId);

    if (error) {
      toast.error("Error updating account lock status");
    } else {
      toast.success(
        `Account ${!currentlyLocked ? "locked" : "unlocked"} successfully`
      );
    }
  };

  const handleTogglePause = async (
    userId: string,
    currentlyPaused: boolean
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_paused: !currentlyPaused })
      .eq("id", userId);

    if (error) {
      toast.error("Error updating account pause status");
    } else {
      toast.success(
        `Account ${!currentlyPaused ? "paused" : "resumed"} successfully`
      );
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
      .from("profiles")
      .update({
        subscription_plan: plan,
        subscription_status: "active",
      })
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("Error updating subscription");
    } else {
      toast.success(`Subscription updated to ${plan}`);
      setSubscriptionDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

  const handleAssignRole = async (role: "super_admin" | "admin" | "user") => {
    if (!selectedUser) return;

    console.log("Assigning role:", role, "to user:", selectedUser.id);

    const { data, error } = await supabase
      .from("user_roles")
      .insert({
        user_id: selectedUser.id,
        role: role,
      })
      .select();

    console.log("Insert result:", { data, error });

    if (error) {
      if (error.code === "23505") {
        toast.error("User already has this role");
      } else {
        toast.error(`Error assigning role: ${error.message}`);
        console.error("Full error:", error);
      }
    } else {
      toast.success(`Role ${role} assigned successfully`);
      setRoleDialogOpen(false);
      setSelectedUser(null);
      fetchUserRoles();
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as any);

    if (error) {
      toast.error("Error removing role");
      console.error(error);
    } else {
      toast.success(`Role ${role} removed successfully`);
      fetchUserRoles();
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return;

    const confirmation = prompt(
      `⚠️ WARNING: This will permanently delete ${selectedUserIds.size} selected user(s) and their associated data.\n\nType "DELETE SELECTED" to confirm:`
    );

    if (confirmation !== "DELETE SELECTED") {
      if (confirmation !== null) {
        toast.error("Deletion cancelled - confirmation text did not match");
      }
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const userId of Array.from(selectedUserIds)) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        errorCount++;
        console.error(`Failed to delete user ${userId}:`, error);
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} user(s) deleted successfully`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} user(s) failed to delete`);
    }

    setSelectedUserIds(new Set());
    fetchUsers();
  };

  const handleDeleteAllUsers = async () => {
    const confirmation = prompt(
      `⚠️ DANGER: This will permanently delete ALL ${users.length} users and their associated data (domains, inboxes, warmups).\n\nType "DELETE ALL USERS" to confirm:`
    );

    if (confirmation !== "DELETE ALL USERS") {
      if (confirmation !== null) {
        toast.error("Deletion cancelled - confirmation text did not match");
      }
      return;
    }

    const userIds = users.map((u) => u.id);

    // Delete all users using auth admin
    let successCount = 0;
    let errorCount = 0;

    for (const userId of userIds) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        errorCount++;
        console.error(`Failed to delete user ${userId}:`, error);
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} users deleted successfully`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} users failed to delete`);
    }

    fetchUsers();
  };

 

  const handleToggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground">Manage all system users</p>
          </div>
          <div className="flex gap-2">
            {selectedUserIds?.size > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedUserIds?.size})
              </Button>
            )}
            {users.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteAllUsers}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Users
              </Button>
            )}
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (open) {
                  // Clear form and selected user when opening dialog
                  setFormData({
                    email: "",
                    password: "",
                    full_name: "",
                    phone: "",
                  });
                  setSelectedUser(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system
                  </DialogDescription>
                </DialogHeader>
                {/* Inputs without <form> */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="fname">First Name</Label>
                    <Input
                      id="fname"
                      name="fname"
                      value={formData.fname}
                      onChange={handleInputChange}
                    />
                    {errors.fname && (
                      <p className="text-red-500 text-sm">{errors.fname}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lname">Last Name</Label>
                    <Input
                      id="lname"
                      name="lname"
                      value={formData.lname}
                      onChange={handleInputChange}
                    />
                    {errors.lname && (
                      <p className="text-red-500 text-sm">{errors.lname}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                    />
                    {errors.company_name && (
                      <p className="text-red-500 text-sm">
                        {errors.company_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                      Confirm Password
                    </Label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                    />
                    {errors.password_confirmation && (
                      <p className="text-red-500 text-sm">
                        {errors.password_confirmation}
                      </p>
                    )}
                  </div>

                  {/* Checkbox Access */}
                  <div className="space-y-2">
                    <Label>Access Tools</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          name="email_tool"
                          checked={formData.email_tool}
                          onChange={handleInputChange}
                        />{" "}
                        Email Tool
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          name="domains_tool"
                          checked={formData.domains_tool}
                          onChange={handleInputChange}
                        />{" "}
                        Domains Tool
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          name="warm_up_tool"
                          checked={formData.warm_up_tool}
                          onChange={handleInputChange}
                        />{" "}
                        WarmUp Tool
                      </label>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    className="w-full"
                    disabled={creating}
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></span>
                        Creating...
                      </span>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {editForm && (
              <Dialog open={editForm} onOpenChange={setEditForm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update New User</DialogTitle>
                    <DialogDescription>
                      Update user to the system
                    </DialogDescription>
                  </DialogHeader>
                  {/* Inputs without <form> */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <Label htmlFor="fname">First Name</Label>
                      <Input
                        id="fname"
                        name="fname"
                        value={formData.fname}
                        onChange={handleInputChange}
                      />
                      {errors.fname && (
                        <p className="text-red-500 text-sm">{errors.fname}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lname">Last Name</Label>
                      <Input
                        id="lname"
                        name="lname"
                        value={formData.lname}
                        onChange={handleInputChange}
                      />
                      {errors.lname && (
                        <p className="text-red-500 text-sm">{errors.lname}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleSelectChange}
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                      {errors.status && (
                        <p className="text-red-500 text-sm">{errors.status}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm">
                          {errors.password}
                        </p>
                      )}
                    </div>
                    {/* Checkbox Access */}
                    <div className="space-y-2">
                      <Label>Access Tools</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            name="email_tool"
                            checked={formData.email_tool}
                            onChange={handleInputChange}
                          />{" "}
                          Email Tool
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            name="domains_tool"
                            checked={formData.domains_tool}
                            onChange={handleInputChange}
                          />{" "}
                          Domains Tool
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            name="warm_up_tool"
                            checked={formData.warm_up_tool}
                            onChange={handleInputChange}
                          />{" "}
                          WarmUp Tool
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            name="ghl_tool"
                            checked={formData.ghl_tool}
                            onChange={handleInputChange}
                          />{" "}
                          GHL Tool
                        </label>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpdateUser}
                      className="w-full"
                      disabled={updating}
                    >
                      {updating ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></span>
                          Updating...
                        </span>
                      ) : (
                        "Update User"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {users?.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {
                  users?.filter((u) => !u.account_locked && !u.account_paused)
                    .length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Locked Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {users?.filter((u) => u.account_locked).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Paused Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {users?.filter((u) => u.account_paused).length}
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
                <Button onClick={handleExportCsv}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1); // Reset to first page on new search
                  }}
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
                {searchQuery
                  ? "No users found matching your search"
                  : "No users found"}
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleToggleSelectAll}
                      />
                    </TableHead>
                      <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stripe</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className={
                          user.account_locked ? "bg-destructive/5" : ""
                        }
                      >
                         <TableCell className="w-12">
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => handleToggleSelectUser(user.id)}
                        />
                      </TableCell>
                        <TableCell className="font-medium">
                          {user.name || "—"}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                         <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userRoles[user.id]?.map((role) => (
                            <span
                              key={role}
                              className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-500 flex items-center gap-1 cursor-pointer hover:bg-purple-500/30"
                              onClick={() => {
                                if (confirm(`Remove ${role} role from this user?`)) {
                                  handleRemoveRole(user.id, role);
                                }
                              }}
                              title="Click to remove this role"
                            >
                              <Shield className="h-3 w-3" />
                              {role}
                            </span>
                          )) || "—"}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setRoleDialogOpen(true);
                                }}
                                className="h-6 px-2"
                              >
                                <Shield className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Assign Admin Role</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                       <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setSubscriptionDialogOpen(true);
                          }}
                          className="gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.subscription_plan === 'unlimited' ? 'bg-purple-500/20 text-purple-500' :
                            user.subscription_plan === 'professional' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {user.subscription_plan === 'unlimited' ? 'Unlimited (£299)' :
                             user.subscription_plan === 'professional' ? 'Professional (£99)' :
                             'Starter (£69)'}
                          </span>
                        </Button>
                        {user.account_paused && (
                          <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-500 ml-2">
                            Paused
                          </span>
                        )}
                      </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              user.status == "1"
                                ? "bg-red-500/20 text-red-500"
                                : user.status == "1"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-orange-500/20 text-orange-500"
                            }`}
                          >
                            {user.status == "1" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {user.stripe_customer_id ? (
                              <>
                                <div
                                  className="truncate max-w-[100px]"
                                  title={user.stripe_customer_id}
                                >
                                  {user.stripe_customer_id}
                                </div>
                                {user.next_billing_date && (
                                  <div className="text-muted-foreground">
                                    Next:{" "}
                                    {new Date(
                                      user.next_billing_date
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewAsUser(user.id, user.email)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View as User</TooltipContent>
                            </Tooltip>
                              <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    handleEditClick(user);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit User</TooltipContent>
                            </Tooltip>
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleLock(user.id, user.account_locked)}
                                >
                                  {user.account_locked ? (
                                    <Unlock className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Lock className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {user.account_locked ? "Unlock Account" : "Lock Account"}
                              </TooltipContent>
                            </Tooltip>
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTogglePause(user.id, user.account_paused)}
                                   title={
                                user.status == "1"
                                  ? "Pause account"
                                  : "Resume account"
                              }
                             >
                                 

                                   {user.status == "1" ? (
                                <Pause className="h-4 w-4 text-red-500" />
                              ) : (
                                <Play className="h-4 w-4 text-green-500" />
                              )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {user.account_paused ? "Resume Account" : "Pause Account"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setPasswordDialogOpen(true);
                                  }}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Change Password</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setSubscriptionDialogOpen(true);
                                  }}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Manage Subscription</TooltipContent>
                            </Tooltip>
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete User</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                <Pagination
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  total={data?.total}
                />
              </>
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

        {/* Role Assignment Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Admin Role</DialogTitle>
              <DialogDescription>
                Assign an admin role to {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleAssignRole('super_admin')}
                  variant="outline"
                  className="flex flex-col h-auto p-4"
                >
                  <Shield className="h-6 w-6 mb-2 text-purple-500" />
                  <span className="font-semibold">Super Admin</span>
                  <span className="text-xs text-muted-foreground">Full access</span>
                </Button>
                <Button
                  onClick={() => handleAssignRole('admin')}
                  variant="outline"
                  className="flex flex-col h-auto p-4"
                >
                  <Shield className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="font-semibold">Admin</span>
                  <span className="text-xs text-muted-foreground">Full access</span>
                </Button>
                <Button
                  onClick={() => handleAssignRole('user')}
                  variant="outline"
                  className="flex flex-col h-auto p-4"
                >
                  <Shield className="h-6 w-6 mb-2 text-gray-500" />
                  <span className="font-semibold">User</span>
                  <span className="text-xs text-muted-foreground">Regular user</span>
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Current roles:</strong> {userRoles[selectedUser?.id]?.join(', ') || 'None'}</p>
                <p className="text-xs">Click on a role badge in the table to remove it.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
