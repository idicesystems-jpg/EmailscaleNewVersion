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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Trash2,
  Play,
  Pause,
  Upload,
  Plus,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Activity,
  Download,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BulkUploadWarmupPool } from "@/components/BulkUploadWarmupPool";
import Pagination from "@/components/Pagination";
import {
  useFetchEmailWarmupQuery,
  useDeleteWarmupEmailMutation,
  useBulkDeleteWarmupEmailMutation,
  useExportWarmupCsvMutation,
  useFetchEmailProviderCountsQuery,
  useSaveEmailNewMutation,
  useExportEmailAccountsCsvMutation,
  useDeleteEmailAccountsMutation
} from "../../services/emailWarmupService";
import { useImpersonation } from "@/hooks/useImpersonation";

const AdminWarmups = () => {
   const { impersonatedUserId } = useImpersonation();
  // Component for managing warmup accounts and pool
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  //fetch users code
  const { data, error, isLoading } = useFetchEmailWarmupQuery({
    page,
    limit,
    search,
  });

  console.log("Warmup data fetched:", data);

  const [warmupLogs, setWarmupLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedWarmup, setSelectedWarmup] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const poolAccounts = data?.data?.campaigns || [];
  const warmups = data?.data?.campaigns || [];

  const [saveEmailNew] = useSaveEmailNewMutation();

  console.log("Fetched warmup data:", data?.data);

  const [currentPage, setCurrentPage] = useState(1);
  const [logsCurrentPage, setLogsCurrentPage] = useState(1);
  const [selectedWarmupRows, setSelectedWarmupRows] = useState<string[]>([]);
  const itemsPerPage = 10;
  const [newAccount, setNewAccount] = useState({
    email_address: "",
    provider: "gmail",
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    imap_host: "",
    imap_port: 993,
    imap_username: "",
    imap_password: "",
  });

  useEffect(() => {
    //fetchWarmups();
    //fetchPoolAccounts();
    fetchUsers();
    fetchWarmupLogs();
    fetchInboxes();
  }, [impersonatedUserId]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
  };

  const fetchInboxes = async () => {
    const { data, error } = await supabase
      .from("inboxes")
      .select("id, email_address, health_score")
      .order("health_score", { ascending: false });

    if (error) {
      console.error("Error fetching inboxes:", error);
    } else {
      setInboxes(data || []);
    }
  };

  const fetchWarmupLogs = async () => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from("warmup_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      toast.error("Error fetching warmup logs");
      console.error(error);
    } else {
      setWarmupLogs(data || []);
    }
    setLogsLoading(false);
  };

  const handleToggleStatus = async (
    warmupId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";

    const { error } = await supabase
      .from("warmup_accounts")
      .update({ warmup_status: newStatus })
      .eq("id", warmupId);

    if (error) {
      toast.error("Error updating warmup status");
    } else {
      toast.success(`Warmup ${newStatus === "active" ? "resumed" : "paused"}`);
      //fetchWarmups();
    }
  };


   const [deleteEmailAccounts] = useDeleteEmailAccountsMutation();

  const handleDeleteWarmup = async (warmupId: string) => {
    if (!confirm("Are you sure you want to delete this warmup account?"))
      return;
    try {
      await deleteEmailAccounts(warmupId).unwrap();
      toast.success("Email deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete email!");
    }
  };

  const handleAddPoolAccount = async () => {
    const { error } = await supabase.from("warmup_pool").insert([newAccount]);

    if (error) {
      toast.error("Error adding account to pool");
      console.error(error);
    } else {
      toast.success("Account added to warmup pool");
      setAddDialogOpen(false);
      setNewAccount({
        email_address: "",
        provider: "gmail",
        smtp_host: "",
        smtp_port: 587,
        smtp_username: "",
        smtp_password: "",
        imap_host: "",
        imap_port: 993,
        imap_username: "",
        imap_password: "",
      });
      //fetchPoolAccounts();
    }
  };

  const handleBulkUpload = async (csvText: string) => {
    const lines = csvText.trim().split("\n");
    const accounts = lines
      .slice(1)
      .map((line) => {
        const [
          email,
          provider,
          smtp_host,
          smtp_port,
          smtp_user,
          smtp_pass,
          imap_host,
          imap_port,
          imap_user,
          imap_pass,
        ] = line.split(",");
        return {
          email_address: email?.trim(),
          provider: provider?.trim() || "other",
          smtp_host: smtp_host?.trim(),
          smtp_port: smtp_port?.trim() ? parseInt(smtp_port.trim()) : null,
          smtp_username: smtp_user?.trim(),
          smtp_password: smtp_pass?.trim(),
          imap_host: imap_host?.trim(),
          imap_port: imap_port?.trim() ? parseInt(imap_port.trim()) : null,
          imap_username: imap_user?.trim(),
          imap_password: imap_pass?.trim(),
        };
      })
      .filter((acc) => acc.email_address);

    const { error } = await supabase.from("warmup_pool").insert(accounts);

    if (error) {
      toast.error("Error uploading accounts");
      console.error(error);
    } else {
      toast.success(`${accounts.length} accounts added to pool`);
      setBulkUploadDialogOpen(false);
      //fetchPoolAccounts();
    }
  };

  const [bulkDeleteWarmupEmail] = useBulkDeleteWarmupEmailMutation();

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      toast.error("No accounts selected");
      return;
    }

    if (!confirm(`Delete ${selectedRows.length} selected accounts?`)) return;

     await bulkDeleteWarmupEmail(selectedRows).unwrap();

    if (error) {
      toast.error("Error deleting accounts");
    } else {
      toast.success(`${selectedRows.length} accounts deleted`);
      setSelectedRows([]);
      //fetchPoolAccounts();
    }
  };

  const [deleteWarmupEmail] = useDeleteWarmupEmailMutation();
  const handleDeletePoolAccount = async (id: string) => {
    if (!confirm("Delete this account from the pool?")) return;
    try {
      await deleteWarmupEmail(id).unwrap();
      toast.success("Email deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete email!");
    }
  };



  const handleReassignWarmup = async () => {
    if (!selectedWarmup || !selectedUserId) return;

    const { error } = await supabase
      .from("warmup_accounts")
      .update({ user_id: selectedUserId })
      .eq("id", selectedWarmup.id);

    if (error) {
      toast.error("Error reassigning warmup account");
    } else {
      toast.success("Warmup account reassigned");
      setReassignDialogOpen(false);
      setSelectedWarmup(null);
      setSelectedUserId("");
      //fetchWarmups();
    }
  };

  const handleBulkDeleteWarmups = async () => {
    alert("check");
    if (selectedWarmupRows.length === 0) {
      toast.error("No warmup accounts selected");
      return;
    }

    if (
      !confirm(`Delete ${selectedWarmupRows.length} selected warmup accounts?`)
    )
      return;

    const { error } = await supabase
      .from("warmup_accounts")
      .delete()
      .in("id", selectedWarmupRows);

    if (error) {
      toast.error("Error deleting warmup accounts");
    } else {
      toast.success(`${selectedWarmupRows.length} warmup accounts deleted`);
      setSelectedWarmupRows([]);
      //fetchWarmups();
    }
  };

  const totalPoolSends = poolAccounts?.reduce(
    (sum, acc) => sum + (acc?.total_sends || 0),
    0
  );
  const totalPages = Math.ceil(warmups.length / itemsPerPage);
  const paginatedWarmups = warmups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const logsTotalPages = Math.ceil(warmupLogs.length / itemsPerPage);
  const paginatedLogs = warmupLogs.slice(
    (logsCurrentPage - 1) * itemsPerPage,
    logsCurrentPage * itemsPerPage
  );

  // Analytics calculations
  const totalSent = warmupLogs.filter(
    (l) => l.status === "sent" || l.received_at
  ).length;
  const totalReceived = warmupLogs.filter((l) => l.received_at).length;
  const totalReplied = warmupLogs.filter((l) => l.replied_at).length;
  const inboxRate =
    totalReceived > 0
      ? (
          (warmupLogs.filter((l) => l.landed_in === "inbox").length /
            totalReceived) *
          100
        ).toFixed(1)
      : 0;
  const replyRate =
    totalReceived > 0 ? ((totalReplied / totalReceived) * 100).toFixed(1) : 0;

  // Health status ranges for warmup accounts
  const healthRanges = data?.data?.warmupData || [];
  // const healthRanges = {
  //   critical: inboxes.filter(i => Number(i.health_score) >= 0 && Number(i.health_score) <= 25).length,
  //   poor: inboxes.filter(i => Number(i.health_score) >= 26 && Number(i.health_score) <= 50).length,
  //   fair: inboxes.filter(i => Number(i.health_score) >= 51 && Number(i.health_score) <= 75).length,
  //   good: inboxes.filter(i => Number(i.health_score) >= 76 && Number(i.health_score) <= 90).length,
  //   excellent: inboxes.filter(i => Number(i.health_score) >= 91 && Number(i.health_score) <= 100).length,
  // };

  const [exportWarmupCsv] = useExportWarmupCsvMutation();

  const handleExportWarmupCsv = async () => {
    try {
      const blob = await exportWarmupCsv().unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "all_warmupemail_export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV Export failed:", error);
      alert("Failed to export warmup CSV.");
    }
  };

  const [exportEmailAccountsCsv] = useExportEmailAccountsCsvMutation();

  const handleExportEmailAccountsCsv = async () => {
    try {
      const blob = await exportEmailAccountsCsv().unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "all_email_accounts_export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV Export failed:", error);
      alert("Failed to export email account CSV.");
    }
  };

  const handleDeleteAllWarmups = async () => {
    const confirmation = prompt(
      `⚠️ DANGER: This will permanently delete ALL ${warmups.length} user warmup accounts.\n\nType "DELETE ALL WARMUPS" to confirm:`
    );
    
    if (confirmation !== "DELETE ALL WARMUPS") {
      if (confirmation !== null) {
        toast.error("Deletion cancelled - confirmation text did not match");
      }
      return;
    }

    const { error } = await supabase
      .from('warmup_accounts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      toast.error("Error deleting all warmup accounts");
      console.error(error);
    } else {
      toast.success(`All ${warmups.length} warmup accounts deleted successfully`);
      fetchWarmups();
    }
  };

  const handleDeleteAllPoolAccounts = async () => {
    const confirmation = prompt(
      `⚠️ DANGER: This will permanently delete ALL ${poolAccounts.length} warmup pool accounts.\n\nType "DELETE ALL POOL" to confirm:`
    );
    
    if (confirmation !== "DELETE ALL POOL") {
      if (confirmation !== null) {
        toast.error("Deletion cancelled - confirmation text did not match");
      }
      return;
    }

    const { error } = await supabase
      .from('warmup_pool')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      toast.error("Error deleting all pool accounts");
      console.error(error);
    } else {
      toast.success(`All ${poolAccounts.length} pool accounts deleted successfully`);
      setSelectedRows([]);
      fetchPoolAccounts();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Warmup Management
          </h1>
          <p className="text-muted-foreground">
            Manage warmup pool and user accounts
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger
              value="pool"
              onClick={() => {
                setPage(1);
                setLimit(10);
                setSearch("");
              }}
            >
              Warmup Pool
            </TabsTrigger>
            <TabsTrigger
              value="users"
              onClick={() => {
                setPage(1);
                setLimit(10);
                setSearch("");
              }}
            >
              User Warmup Accounts
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              onClick={() => {
                setPage(1);
                setLimit(10);
                setSearch("");
              }}
            >
              Warmup Logs & Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pool" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Pool Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {poolAccounts?.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Active Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {poolAccounts?.filter((a) => a.status === "active").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Warmup Emails Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {totalPoolSends?.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Warmup Pool</CardTitle>
                    <CardDescription>
                      Gmail, AOL, Yahoo, Microsoft accounts for warmup
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                     {poolAccounts.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={handleDeleteAllPoolAccounts}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Pool
                      </Button>
                    )}
                    {selectedRows.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedRows.length})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkUploadDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportWarmupCsv}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Dialog
                      open={addDialogOpen}
                      onOpenChange={setAddDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Account to Pool</DialogTitle>
                          <DialogDescription>
                            Add a new email account to the warmup pool
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Email Address</Label>
                              <Input
                                value={newAccount.email_address}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    email_address: e.target.value,
                                  })
                                }
                                placeholder="email@example.com"
                              />
                            </div>
                            <div>
                              <Label>Provider</Label>
                              <Select
                                value={newAccount.provider}
                                onValueChange={(v) =>
                                  setNewAccount({ ...newAccount, provider: v })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gmail">Gmail</SelectItem>
                                  <SelectItem value="aol">AOL</SelectItem>
                                  <SelectItem value="yahoo">Yahoo</SelectItem>
                                  <SelectItem value="microsoft">
                                    Microsoft
                                  </SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>SMTP Host</Label>
                              <Input
                                value={newAccount.smtp_host}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    smtp_host: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>SMTP Port</Label>
                              <Input
                                type="number"
                                value={newAccount.smtp_port}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    smtp_port: parseInt(e.target.value) || 587,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>SMTP Username</Label>
                              <Input
                                value={newAccount.smtp_username}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    smtp_username: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>SMTP Password</Label>
                              <Input
                                type="password"
                                value={newAccount.smtp_password}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    smtp_password: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>IMAP Host</Label>
                              <Input
                                value={newAccount.imap_host}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    imap_host: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>IMAP Port</Label>
                              <Input
                                type="number"
                                value={newAccount.imap_port}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    imap_port: parseInt(e.target.value) || 993,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>IMAP Username</Label>
                              <Input
                                value={newAccount.imap_username}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    imap_username: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>IMAP Password</Label>
                              <Input
                                type="password"
                                value={newAccount.imap_password}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    imap_password: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <Button onClick={handleAddPoolAccount}>
                          Add to Pool
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {poolLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : poolAccounts?.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No accounts in warmup pool
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={
                                selectedRows?.length === poolAccounts?.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRows(
                                    poolAccounts?.map((a) => a.id)
                                  );
                                } else {
                                  setSelectedRows([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Daily Sends</TableHead>
                          <TableHead>Total Sends</TableHead>
                          <TableHead>Last Send</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poolAccounts?.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(account.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRows([
                                      ...selectedRows,
                                      account.id,
                                    ]);
                                  } else {
                                    setSelectedRows(
                                      selectedRows.filter(
                                        (id) => id !== account.id
                                      )
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {account.smtp_username}
                            </TableCell>
                            <TableCell className="capitalize">
                              {account.email_provider}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  account.warmup_enabled === "TRUE"
                                    ? "bg-green-500/20 text-green-500"
                                    : account.warmup_enabled === "FALSE"
                                    ? "bg-gray-500/20 text-gray-500"
                                    : "bg-red-500/20 text-red-500"
                                }`}
                              >
                                {account.warmup_enabled ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>{account.daily_volume}</TableCell>
                            <TableCell>{account.total_email}</TableCell>
                            <TableCell>
                              {account.last_send_at
                                ? new Date(
                                    account.last_send_at
                                  ).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeletePoolAccount(account.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
                      total={data?.data?.total}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            {/* Health Status Dashboard */}
            <div className="grid gap-4 md:grid-cols-5 mb-6">
              <Card className="border-red-500/50 bg-red-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-500" />
                    Critical (0-25)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {healthRanges.warmup1}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Needs immediate attention
                  </p>
                </CardContent>
              </Card>
              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    Poor (26-50)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {healthRanges.warmup2}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires monitoring
                  </p>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-500" />
                    Fair (51-75)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">
                    {healthRanges.warmup3}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Moderate health
                  </p>
                </CardContent>
              </Card>
              <Card className="border-blue-500/50 bg-blue-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Good (76-90)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {healthRanges.warmup4}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Healthy status
                  </p>
                </CardContent>
              </Card>
              <Card className="border-green-500/50 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    Excellent (91-100)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {healthRanges.warmup5}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimal performance
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Warmup Accounts</CardTitle>
                    <CardDescription>
                      Monitor user warmup progress and status ({warmups.length}{" "}
                      total)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                  {paginatedWarmups?.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteAllWarmups}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All Warmups
                        </Button>
                      )}
                  {selectedWarmupRows.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteWarmups}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedWarmupRows.length})
                    </Button>
                  )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportEmailAccountsCsv}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : warmups.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No user warmup accounts found
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={
                                selectedWarmupRows.length ===
                                  paginatedWarmups.length &&
                                paginatedWarmups.length > 0
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedWarmupRows(
                                    paginatedWarmups.map((w) => w.id)
                                  );
                                } else {
                                  setSelectedWarmupRows([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Daily Limit</TableHead>
                          <TableHead>Sent Today</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedWarmups.map((warmup) => (
                          <TableRow key={warmup.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedWarmupRows.includes(warmup.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedWarmupRows([
                                      ...selectedWarmupRows,
                                      warmup.id,
                                    ]);
                                  } else {
                                    setSelectedWarmupRows(
                                      selectedWarmupRows.filter(
                                        (id) => id !== warmup.id
                                      )
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {warmup?.smtp_username || "—"}
                            </TableCell>
                            <TableCell>
                              {warmup.first_name + "  " + warmup?.last_name ||
                                "—"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  warmup.warmup_status === "TRUE"
                                    ? "bg-green-500/20 text-green-500"
                                    : warmup.warmup_status === "FALSE"
                                    ? "bg-orange-500/20 text-orange-500"
                                    : "bg-blue-500/20 text-blue-500"
                                }`}
                              >
                                {warmup.warmup_enabled ? "Active" : "Paused"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={Number(warmup.health_score)}
                                  className="w-20 h-2"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {warmup.health_score}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{warmup.daily_limit}</TableCell>
                            <TableCell>{warmup.current_daily_sent}</TableCell>
                            <TableCell>
                              {new Date(warmup.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWarmup(warmup);
                                    setReassignDialogOpen(true);
                                  }}
                                  title="Reassign to user"
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleToggleStatus(
                                      warmup.id,
                                      warmup.warmup_status
                                    )
                                  }
                                >
                                  {warmup.warmup_status === "active" ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                {/* <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteWarmup(warmup.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button> */}
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
                      total={data?.data?.total}
                    />

                    {/* {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, warmups.length)} of {warmups.length} accounts
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )} */}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {totalSent}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {totalReceived}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Replied
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {totalReplied}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Inbox Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {inboxRate}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Reply Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {replyRate}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Warmup Activity Logs</CardTitle>
                    <CardDescription>
                      Detailed email warmup tracking ({warmupLogs.length} total
                      logs)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : warmupLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No warmup logs yet
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Received</TableHead>
                          <TableHead>Reply</TableHead>
                          <TableHead>Landed In</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  log.status === "sent"
                                    ? "bg-blue-500/20 text-blue-500"
                                    : log.status === "received"
                                    ? "bg-green-500/20 text-green-500"
                                    : log.status === "replied"
                                    ? "bg-purple-500/20 text-purple-500"
                                    : log.status === "bounced"
                                    ? "bg-orange-500/20 text-orange-500"
                                    : "bg-red-500/20 text-red-500"
                                }`}
                              >
                                {log.status}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {log.subject || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.from_email}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.to_email}
                            </TableCell>
                            <TableCell className="text-xs">
                              {log.sent_at
                                ? new Date(log.sent_at).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {log.received_at
                                ? new Date(log.received_at).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {log.replied_at
                                ? new Date(log.replied_at).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {log.landed_in ? (
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    log.landed_in === "inbox"
                                      ? "bg-green-500/20 text-green-500"
                                      : log.landed_in === "spam"
                                      ? "bg-red-500/20 text-red-500"
                                      : "bg-gray-500/20 text-gray-500"
                                  }`}
                                >
                                  {log.landed_in}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {logsTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {(logsCurrentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            logsCurrentPage * itemsPerPage,
                            warmupLogs.length
                          )}{" "}
                          of {warmupLogs.length} logs
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLogsCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={logsCurrentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(logsTotalPages, 5) },
                              (_, i) => {
                                const page = i + 1;
                                return (
                                  <Button
                                    key={page}
                                    variant={
                                      logsCurrentPage === page
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setLogsCurrentPage(page)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {page}
                                  </Button>
                                );
                              }
                            )}
                            {logsTotalPages > 5 && (
                              <span className="px-2">...</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLogsCurrentPage((p) =>
                                Math.min(logsTotalPages, p + 1)
                              )
                            }
                            disabled={logsCurrentPage === logsTotalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign Warmup Account</DialogTitle>
              <DialogDescription>
                Assign this warmup account to a different user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current User</Label>
                <Input
                  value={
                    selectedWarmup?.profiles?.full_name ||
                    selectedWarmup?.profiles?.email ||
                    "—"
                  }
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Assign to User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleReassignWarmup} disabled={!selectedUserId}>
                Reassign Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <BulkUploadWarmupPool
          open={bulkUploadDialogOpen}
          onOpenChange={setBulkUploadDialogOpen}
          saveEmailNew={saveEmailNew}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminWarmups;
