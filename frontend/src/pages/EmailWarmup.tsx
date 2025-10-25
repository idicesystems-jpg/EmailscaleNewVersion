import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Flame,
  Plus,
  Send,
  Target,
  ShieldAlert,
  Activity,
  Play,
  Pause,
  Upload,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {useListEmailCampaignsQuery} from "../services/userEmailWarmupService";
import {useSelector} from "react-redux"

const EmailWarmup = () => {

   const [query, setQuery] = useState('');
   const [sortConfig, setSortConfig] = useState({ key: 'warmup_emails', direction: "asc" });

    const { user, token, isAuthenticated } = useSelector(
      (state: any) => state.auth
    );

  const { data, isLoading } = useListEmailCampaignsQuery({
  user_id: user.id,
  q: query,
  sortKey: sortConfig.key,
  sortDirection: sortConfig.direction,
});

  const [stats, setStats] = useState({
    totalEmailsSent: 0,
    inboxRate: 0,
    spamEmails: 0,
    avgHealthScore: 0,
  });
  const [warmupAccounts, setWarmupAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"manual" | "csv">("manual");
  const [formData, setFormData] = useState({
    campaign_name: "",
    subject: "",
    campaign_msg: "",
    first_name: "",
    last_name: "",
    smtp_username: "",
    smtp_password: "",
    smtp_host: "",
    smtp_port: null,
    warmup_enabled: false,
    daily_limit:null,
    warmup_limit:null,
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch warmup accounts with inbox data
    const { data: warmups } = await supabase
      .from("warmup_accounts")
      .select(
        `
        *,
        inboxes (id, email_address, health_score)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch email sends for all accounts
    const { data: allSends } = await supabase
      .from("email_sends")
      .select("*")
      .eq("user_id", user.id);

    // Calculate individual stats for each account
    const accountsWithStats =
      warmups?.map((account) => {
        const accountSends =
          allSends?.filter((s) => s.inbox_id === account.inbox_id) || [];
        const totalSent = accountSends.length;
        const inboxCount = accountSends.filter(
          (s) => s.placement === "inbox"
        ).length;
        const spamCount = accountSends.filter(
          (s) => s.placement === "spam"
        ).length;
        const inboxRate =
          totalSent > 0 ? Math.round((inboxCount / totalSent) * 100) : 0;

        return {
          ...account,
          stats: {
            totalSent,
            inboxRate,
            spamCount,
          },
        };
      }) || [];

    setWarmupAccounts(accountsWithStats);

    // Calculate overall stats
    const totalSent = allSends?.length || 0;
    const inboxCount =
      allSends?.filter((s) => s.placement === "inbox").length || 0;
    const spamCount =
      allSends?.filter((s) => s.placement === "spam").length || 0;
    const inboxRate =
      totalSent > 0 ? Math.round((inboxCount / totalSent) * 100) : 0;

    // Calculate average health score
    const avgHealth =
      warmups?.reduce(
        (acc, curr) => acc + (Number(curr.inboxes?.health_score) || 0),
        0
      ) / (warmups?.length || 1);

    setStats({
      totalEmailsSent: totalSent,
      inboxRate,
      spamEmails: spamCount,
      avgHealthScore: Math.round(avgHealth || 0),
    });

    setLoading(false);
  };


  const validateForm = () => {
  const requiredFields = [
    "campaign_name",
    "subject",
    "campaign_msg",
    "first_name",
    "last_name",
    "smtp_username",
    "smtp_password",
    "smtp_host",
    "smtp_port",
  ];

  for (const field of requiredFields) {
    if (!formData[field] || formData[field].toString().trim() === "") {
      alert(`Please enter ${field.replace(/_/g, " ")}`);
      return false;
    }
  }

  // Only validate warmup fields if enabled
  if (formData.warmup_enabled) {
    if (!formData.daily_limit) {
      alert("Please enter daily limit");
      return false;
    }
    if (!formData.warmup_limit) {
      alert("Please enter warmup limit");
      return false;
    }
  }

  return true;
};


  const handleAddAccount = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Validate all required fields
  if (!validateForm()) {
    setLoading(false);
    return;
  }
};


  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const text = await csvFile.text();
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(",").map((v) => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        try {
          // Create inbox with full credentials
          const { data: inbox, error: inboxError } = await supabase
            .from("inboxes")
            .insert({
              user_id: user.id,
              email_address: row["Email"],
              first_name: row["First Name"],
              last_name: row["Last Name"],
              imap_username: row["IMAP Username"],
              imap_password: row["IMAP Password"],
              imap_host: row["IMAP Host"],
              imap_port: parseInt(row["IMAP Port"]) || 993,
              smtp_username: row["SMTP Username"],
              smtp_password: row["SMTP Password"],
              smtp_host: row["SMTP Host"],
              smtp_port: parseInt(row["SMTP Port"]) || 587,
              status: "active",
              health_score: 0,
            })
            .select()
            .single();

          if (inboxError) throw inboxError;

          // Create warmup account if enabled
          if (
            row["Warmup Enabled"] === "TRUE" ||
            row["Warmup Enabled"] === "true"
          ) {
            const { error: warmupError } = await supabase
              .from("warmup_accounts")
              .insert({
                user_id: user.id,
                inbox_id: inbox.id,
                warmup_status: "in_progress",
                daily_limit: parseInt(row["Daily Limit"]) || 10,
                warmup_limit: parseInt(row["Warmup Limit"]) || 10,
                warmup_increment: parseInt(row["Warmup Increment"]) || 1,
                progress_percentage: 0,
              });

            if (warmupError) throw warmupError;
          }

          successCount++;
        } catch (error) {
          console.error(`Error processing row ${i}:`, error);
          errorCount++;
        }
      }

      toast.success(
        `Successfully uploaded ${successCount} accounts${
          errorCount > 0 ? `, ${errorCount} failed` : ""
        }`
      );
      setDialogOpen(false);
      setCsvFile(null);
      fetchData();
    } catch (error) {
      console.error("CSV upload error:", error);
      toast.error("Error processing CSV file");
    } finally {
      setUploading(false);
    }
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
      toast.error("Error updating status");
    } else {
      toast.success(`Warmup ${newStatus === "active" ? "resumed" : "paused"}`);
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Email Warmup
            </h1>
            <p className="text-muted-foreground">
              Gradually increase email sending reputation
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Warmup Account</DialogTitle>
                <DialogDescription>
                  Add accounts manually or upload multiple via CSV
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={uploadMethod}
                onValueChange={(v) => setUploadMethod(v as "manual" | "csv")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="manual">
                  <form
                    onSubmit={handleAddAccount}
                    className="space-y-4 max-h-[60vh] overflow-y-auto px-1"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="Campaign">Campaign Name</Label>
                        <Input
                          id="campaign_name"
                          type="text"
                          placeholder="campaign name"
                          value={formData.campaign_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              campaign_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="Subject">Subject</Label>
                        <Input
                          id="subject"
                          type="text"
                          placeholder="subject"
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subject: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="Campaign Message">
                          Campaign Message
                        </Label>
                        <Textarea
                          id="campaign_msg"
                          placeholder="campaign msg"
                          value={formData.campaign_msg}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              campaign_msg: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              first_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              last_name: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold text-sm mb-3">IMAP Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imapUsername">IMAP Username *</Label>
                          <Input
                            id="imapUsername"
                            value={formData.imapUsername}
                            onChange={(e) => setFormData({ ...formData, imapUsername: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imapPassword">IMAP Password *</Label>
                          <Input
                            id="imapPassword"
                            type="password"
                            value={formData.imapPassword}
                            onChange={(e) => setFormData({ ...formData, imapPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imapHost">IMAP Host *</Label>
                          <Input
                            id="imapHost"
                            placeholder="imap.gmail.com"
                            value={formData.imapHost}
                            onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imapPort">IMAP Port *</Label>
                          <Input
                            id="imapPort"
                            type="number"
                            value={formData.imapPort}
                            onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                    </div> */}

                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold text-sm mb-3">
                        SMTP Settings
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtpUsername">SMTP Username *</Label>
                          <Input
                            id="smtpUsername"
                            value={formData.smtp_username}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                smtp_username: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpPassword">SMTP Password *</Label>
                          <Input
                            id="smtpPassword"
                            type="password"
                            value={formData.smtp_password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                smtp_password: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpHost">SMTP Host *</Label>
                          <Input
                            id="smtpHost"
                            placeholder="smtp.gmail.com"
                            value={formData.smtp_host}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                smtp_host: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpPort">SMTP Port *</Label>
                          <Input
                            id="smtpPort"
                            type="number"
                            value={formData.smtp_port}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                smtp_port: parseInt(e.target.value),
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold text-sm mb-3">
                        Warmup Settings
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="warmupEnabled">Enable Warmup</Label>
                          <Switch
                            id="warmupEnabled"
                            checked={formData.warmup_enabled}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                warmup_enabled: checked,
                              })
                            }
                          />
                        </div>

                        {formData.warmup_enabled && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="dailyLimit">Daily Limit</Label>
                              <Input
                                id="dailyLimit"
                                type="number"
                                min="1"
                                max="200"
                                value={formData.daily_limit}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    daily_limit: parseInt(e.target.value),
                                  })
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Starting emails per day
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="warmupLimit">Warmup Limit</Label>
                              <Input
                                id="warmupLimit"
                                type="number"
                                min="1"
                                max="200"
                                value={formData.warmup_limit}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    warmup_limit: parseInt(e.target.value),
                                  })
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Maximum emails per day
                              </p>
                            </div>
                            {/* <div className="space-y-2">
                              <Label htmlFor="warmupIncrement">Daily Increment</Label>
                              <Input
                                id="warmupIncrement"
                                type="number"
                                min="1"
                                max="20"
                                value={formData.warmupIncrement}
                                onChange={(e) => setFormData({ ...formData, warmupIncrement: parseInt(e.target.value) })}
                              />
                              <p className="text-xs text-muted-foreground">Increase per day</p>
                            </div> */}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Add Account
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="csv">
                  <form onSubmit={handleCsvUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csvFile">CSV File</Label>
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={(e) =>
                          setCsvFile(e.target.files?.[0] || null)
                        }
                        required
                      />
                      <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        <p className="font-semibold">Required CSV columns:</p>
                        <p>
                          Email, First Name, Last Name, IMAP Username, IMAP
                          Password, IMAP Host, IMAP Port, SMTP Username, SMTP
                          Password, SMTP Host, SMTP Port, Daily Limit, Warmup
                          Enabled, Warmup Limit, Warmup Increment
                        </p>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload CSV"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emails Sent
              </CardTitle>
              <Send className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalEmailsSent}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total warmup emails
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inbox Rate
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.inboxRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Landing in inbox
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Spam Emails
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.spamEmails}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Marked as spam
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Health Score
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.avgHealthScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average across accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Flame className="h-5 w-5 mr-2 text-primary" />
              Connected Accounts
            </CardTitle>
            <CardDescription>
              Monitor warmup progress for all accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : warmupAccounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  No accounts connected yet. Add your first account to start
                  warming up.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Emails Sent</TableHead>
                    <TableHead>Inbox Rate</TableHead>
                    <TableHead>Spam Count</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Sent Today</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warmupAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.inboxes?.email_address}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            account.warmup_status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : account.warmup_status === "paused"
                              ? "bg-orange-500/20 text-orange-500"
                              : "bg-blue-500/20 text-blue-500"
                          }`}
                        >
                          {account.warmup_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Number(account.progress_percentage)}
                            className="w-20 h-2"
                          />
                          <span className="text-xs text-muted-foreground">
                            {account.progress_percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            Number(account.inboxes?.health_score) >= 80
                              ? "text-green-500"
                              : Number(account.inboxes?.health_score) >= 60
                              ? "text-orange-500"
                              : "text-red-500"
                          }`}
                        >
                          {account.inboxes?.health_score || 0}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {account.stats?.totalSent || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            account.stats?.inboxRate >= 80
                              ? "text-green-500"
                              : account.stats?.inboxRate >= 60
                              ? "text-orange-500"
                              : "text-red-500"
                          }`}
                        >
                          {account.stats?.inboxRate || 0}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-500 font-medium">
                          {account.stats?.spamCount || 0}
                        </span>
                      </TableCell>
                      <TableCell>{account.daily_limit}</TableCell>
                      <TableCell>{account.current_daily_sent}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(
                              account.id,
                              account.warmup_status
                            )
                          }
                        >
                          {account.warmup_status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmailWarmup;
