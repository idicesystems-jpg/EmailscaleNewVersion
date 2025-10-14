import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Server, AlertTriangle, CheckCircle, XCircle, RefreshCw, Plus, Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const AdminServerMonitoring = () => {
  const [monitoredIPs, setMonitoredIPs] = useState<any[]>([]);
  const [blacklistChecks, setBlacklistChecks] = useState<any[]>([]);
  const [spamComplaints, setSpamComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [addIPDialogOpen, setAddIPDialogOpen] = useState(false);
  const [addComplaintDialogOpen, setAddComplaintDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newIP, setNewIP] = useState({
    ip_address: "",
    hostname: "",
    server_location: "",
    notes: ""
  });
  const [newComplaint, setNewComplaint] = useState({
    email_address: "",
    complaint_type: "manual",
    complaint_source: "",
    complaint_details: "",
    ip_address: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMonitoredIPs(),
      fetchBlacklistChecks(),
      fetchSpamComplaints()
    ]);
    setLoading(false);
  };

  const fetchMonitoredIPs = async () => {
    const { data, error } = await supabase
      .from('monitored_ips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error fetching monitored IPs");
      console.error(error);
    } else {
      setMonitoredIPs(data || []);
    }
  };

  const fetchBlacklistChecks = async () => {
    const { data, error } = await supabase
      .from('ip_blacklist_checks')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Error fetching blacklist checks");
      console.error(error);
    } else {
      setBlacklistChecks(data || []);
    }
  };

  const fetchSpamComplaints = async () => {
    const { data, error } = await supabase
      .from('spam_complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error fetching spam complaints");
      console.error(error);
    } else {
      setSpamComplaints(data || []);
    }
  };

  const handleAddIP = async () => {
    const { error } = await supabase
      .from('monitored_ips')
      .insert([newIP]);

    if (error) {
      toast.error("Error adding IP");
      console.error(error);
    } else {
      toast.success("IP added successfully");
      setAddIPDialogOpen(false);
      setNewIP({ ip_address: "", hostname: "", server_location: "", notes: "" });
      fetchMonitoredIPs();
    }
  };

  const handleAddComplaint = async () => {
    const { error } = await supabase
      .from('spam_complaints')
      .insert([newComplaint]);

    if (error) {
      toast.error("Error adding complaint");
      console.error(error);
    } else {
      toast.success("Complaint added successfully");
      setAddComplaintDialogOpen(false);
      setNewComplaint({
        email_address: "",
        complaint_type: "manual",
        complaint_source: "",
        complaint_details: "",
        ip_address: ""
      });
      fetchSpamComplaints();
    }
  };

  const handleCheckBlacklists = async () => {
    setChecking(true);
    try {
      const { error } = await supabase.functions.invoke('check-ip-blacklists');
      
      if (error) throw error;
      
      toast.success("Blacklist check completed");
      fetchBlacklistChecks();
    } catch (error) {
      console.error("Error checking blacklists:", error);
      toast.error("Error checking blacklists");
    } finally {
      setChecking(false);
    }
  };

  const handleResolveComplaint = async (id: string) => {
    const { error } = await supabase
      .from('spam_complaints')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error("Error resolving complaint");
    } else {
      toast.success("Complaint resolved");
      fetchSpamComplaints();
    }
  };

  const filteredIPs = monitoredIPs.filter(ip =>
    ip.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ip.hostname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeIPs = monitoredIPs.filter(ip => ip.status === 'active').length;
  const blockedIPs = monitoredIPs.filter(ip => ip.status === 'blocked').length;
  const recentBlacklisted = blacklistChecks.filter(check => 
    check.is_blacklisted && 
    new Date(check.checked_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const unresolvedComplaints = spamComplaints.filter(c => !c.resolved).length;

  // Calculate complaint counts per email for repeat offenders
  const complaintCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    spamComplaints.forEach(complaint => {
      counts[complaint.email_address] = (counts[complaint.email_address] || 0) + 1;
    });
    return counts;
  }, [spamComplaints]);

  // Prepare chart data - group blacklist checks by day and calculate health score
  const chartData = useMemo(() => {
    const groupedByDay: Record<string, { date: string; healthy: number; warning: number; critical: number }> = {};
    
    blacklistChecks.forEach(check => {
      const date = new Date(check.checked_at).toLocaleDateString();
      if (!groupedByDay[date]) {
        groupedByDay[date] = { date, healthy: 0, warning: 0, critical: 0 };
      }
      
      if (check.is_blacklisted) {
        // Check if same IP is blacklisted on multiple lists
        const ipBlacklists = blacklistChecks.filter(c => 
          c.ip_address === check.ip_address && 
          c.is_blacklisted &&
          new Date(c.checked_at).toLocaleDateString() === date
        ).length;
        
        if (ipBlacklists >= 3) {
          groupedByDay[date].critical++;
        } else {
          groupedByDay[date].warning++;
        }
      } else {
        groupedByDay[date].healthy++;
      }
    });
    
    return Object.values(groupedByDay).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ).slice(-14); // Last 14 days
  }, [blacklistChecks]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Server Monitoring</h1>
          <p className="text-muted-foreground">Monitor IP reputation and spam complaints</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Active IPs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeIPs}</div>
            </CardContent>
          </Card>
          <Card className={blockedIPs > 0 ? "border-red-500" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Blocked IPs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{blockedIPs}</div>
            </CardContent>
          </Card>
          <Card className={recentBlacklisted > 0 ? "border-orange-500" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Blacklisted (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{recentBlacklisted}</div>
            </CardContent>
          </Card>
          <Card className={unresolvedComplaints > 0 ? "border-orange-500" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Unresolved Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{unresolvedComplaints}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Server Health Monitoring</CardTitle>
            <CardDescription>14-day blacklist check status trend</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">No monitoring data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="healthy" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Healthy"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="warning" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Warning"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="critical" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Critical"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="ips" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ips">Monitored IPs</TabsTrigger>
            <TabsTrigger value="blacklists">Blacklist Checks</TabsTrigger>
            <TabsTrigger value="complaints">Spam Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="ips">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monitored IP Addresses</CardTitle>
                    <CardDescription>Track and monitor server IPs</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search IPs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={handleCheckBlacklists} disabled={checking}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                      Check Blacklists
                    </Button>
                    <Dialog open={addIPDialogOpen} onOpenChange={setAddIPDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add IP
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Monitored IP</DialogTitle>
                          <DialogDescription>Add a new IP address to monitor</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>IP Address</Label>
                            <Input
                              value={newIP.ip_address}
                              onChange={(e) => setNewIP({...newIP, ip_address: e.target.value})}
                              placeholder="192.168.1.1"
                            />
                          </div>
                          <div>
                            <Label>Hostname</Label>
                            <Input
                              value={newIP.hostname}
                              onChange={(e) => setNewIP({...newIP, hostname: e.target.value})}
                              placeholder="mail.example.com"
                            />
                          </div>
                          <div>
                            <Label>Server Location</Label>
                            <Input
                              value={newIP.server_location}
                              onChange={(e) => setNewIP({...newIP, server_location: e.target.value})}
                              placeholder="US-East"
                            />
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Textarea
                              value={newIP.notes}
                              onChange={(e) => setNewIP({...newIP, notes: e.target.value})}
                            />
                          </div>
                          <Button onClick={handleAddIP}>Add IP</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredIPs.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">No monitored IPs</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Hostname</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIPs.map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-mono">{ip.ip_address}</TableCell>
                          <TableCell>{ip.hostname || "—"}</TableCell>
                          <TableCell>{ip.server_location || "—"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              ip.status === 'active' ? 'bg-green-500/20 text-green-500' :
                              ip.status === 'blocked' ? 'bg-red-500/20 text-red-500' :
                              'bg-gray-500/20 text-gray-500'
                            }`}>
                              {ip.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(ip.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blacklists">
            <Card>
              <CardHeader>
                <CardTitle>Blacklist Check History</CardTitle>
                <CardDescription>Recent DNS blacklist check results</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : blacklistChecks.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">No blacklist checks yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Blacklist</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Checked At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blacklistChecks.map((check) => (
                        <TableRow key={check.id} className={check.is_blacklisted ? 'bg-red-500/10' : ''}>
                          <TableCell className="font-mono">{check.ip_address}</TableCell>
                          <TableCell>{check.blacklist_name}</TableCell>
                          <TableCell>
                            {check.is_blacklisted ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate">{check.response_details}</TableCell>
                          <TableCell>{new Date(check.checked_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Spam Complaints</CardTitle>
                    <CardDescription>Track and manage spam complaints</CardDescription>
                  </div>
                  <Dialog open={addComplaintDialogOpen} onOpenChange={setAddComplaintDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Complaint
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Spam Complaint</DialogTitle>
                        <DialogDescription>Record a spam complaint</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Email Address (that received complaint)</Label>
                          <Input
                            value={newComplaint.email_address}
                            onChange={(e) => setNewComplaint({...newComplaint, email_address: e.target.value})}
                            placeholder="sender@example.com"
                          />
                        </div>
                        <div>
                          <Label>Complaint Source</Label>
                          <Select value={newComplaint.complaint_source} onValueChange={(v) => setNewComplaint({...newComplaint, complaint_source: v})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Google">Google</SelectItem>
                              <SelectItem value="Yahoo">Yahoo</SelectItem>
                              <SelectItem value="Microsoft">Microsoft</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Complaint Type</Label>
                          <Select value={newComplaint.complaint_type} onValueChange={(v) => setNewComplaint({...newComplaint, complaint_type: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spamhaus">Spamhaus</SelectItem>
                              <SelectItem value="feedback_loop">Feedback Loop</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>IP Address (optional)</Label>
                          <Input
                            value={newComplaint.ip_address}
                            onChange={(e) => setNewComplaint({...newComplaint, ip_address: e.target.value})}
                            placeholder="192.168.1.1"
                          />
                        </div>
                        <div>
                          <Label>Details</Label>
                          <Textarea
                            value={newComplaint.complaint_details}
                            onChange={(e) => setNewComplaint({...newComplaint, complaint_details: e.target.value})}
                            placeholder="Details about the spam complaint..."
                          />
                        </div>
                        <Button onClick={handleAddComplaint}>Add Complaint</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : spamComplaints.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">No spam complaints</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email Address</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spamComplaints.map((complaint) => {
                        const complaintCount = complaintCounts[complaint.email_address] || 0;
                        const isRepeatOffender = complaintCount >= 3;
                        
                        return (
                          <TableRow 
                            key={complaint.id} 
                            className={
                              !complaint.resolved 
                                ? isRepeatOffender 
                                  ? 'bg-red-500/10 border-l-4 border-red-500' 
                                  : 'bg-orange-500/5'
                                : ''
                            }
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{complaint.email_address}</span>
                                {isRepeatOffender && (
                                  <Badge variant="destructive" className="text-xs">
                                    {complaintCount}x Repeat Offender
                                  </Badge>
                                )}
                                {complaintCount >= 2 && complaintCount < 3 && (
                                  <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-500">
                                    {complaintCount}x
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                complaint.complaint_source === 'Google' ? 'bg-blue-500/20 text-blue-500' :
                                complaint.complaint_source === 'Yahoo' ? 'bg-purple-500/20 text-purple-500' :
                                complaint.complaint_source === 'Microsoft' ? 'bg-cyan-500/20 text-cyan-500' :
                                'bg-gray-500/20 text-gray-500'
                              }`}>
                                {complaint.complaint_source || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="capitalize">{complaint.complaint_type}</TableCell>
                            <TableCell className="font-mono text-xs">{complaint.ip_address || "—"}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm">{complaint.complaint_details || "—"}</TableCell>
                            <TableCell>
                              {complaint.resolved ? (
                                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">
                                  Resolved
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-500">
                                  Pending
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {!complaint.resolved && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleResolveComplaint(complaint.id)}
                                >
                                  Resolve
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminServerMonitoring;
