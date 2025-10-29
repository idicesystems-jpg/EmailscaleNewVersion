import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, ChevronDown, ChevronRight, Download } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useImpersonation } from "@/hooks/useImpersonation";

interface GroupedClient {
  userId: string;
  clientName: string;
  clientEmail: string;
  inboxes: any[];
  totalDomains: number;
}

const AdminInboxes = () => {
  const { impersonatedUserId } = useImpersonation();
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInboxes();
  }, [impersonatedUserId]);

  const fetchInboxes = async () => {
    setLoading(true);
    let query = supabase
      .from('inboxes')
      .select(`
        *,
        profiles:user_id (full_name, email),
        domains (domain_name)
      `);
    
    // Filter by impersonated user if viewing as client
    if (impersonatedUserId) {
      query = query.eq('user_id', impersonatedUserId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast.error("Error fetching inboxes");
      console.error(error);
    } else {
      setInboxes(data || []);
    }
    setLoading(false);
  };

  const handleDeleteInbox = async (inboxId: string) => {
    if (!confirm("Are you sure you want to delete this inbox?")) return;

    const { error } = await supabase
      .from('inboxes')
      .delete()
      .eq('id', inboxId);

    if (error) {
      toast.error("Error deleting inbox");
    } else {
      toast.success("Inbox deleted successfully");
      fetchInboxes();
    }
  };

  const handleDeleteAllInboxes = async () => {
    const confirmation = prompt(
      `⚠️ DANGER: This will permanently delete ALL ${inboxes.length} inboxes and their associated warmup data.\n\nType "DELETE ALL INBOXES" to confirm:`
    );
    
    if (confirmation !== "DELETE ALL INBOXES") {
      if (confirmation !== null) {
        toast.error("Deletion cancelled - confirmation text did not match");
      }
      return;
    }

    const { error } = await supabase
      .from('inboxes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      toast.error("Error deleting all inboxes");
      console.error(error);
    } else {
      toast.success(`All ${inboxes.length} inboxes deleted successfully`);
      fetchInboxes();
    }
  };

  const toggleClient = (userId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedClients(newExpanded);
  };

  const downloadClientCSV = (clientInboxes: any[], clientName: string) => {
    // CSV format: Email,First Name,Last Name,Domain,IMAP Username,IMAP Password,IMAP Host,IMAP Port,SMTP Username,SMTP Password,SMTP Host,SMTP Port,Daily Limit,Warmup Enabled,Warmup Limit,Warmup Increment
    const headers = 'Email,First Name,Last Name,Domain,IMAP Username,IMAP Password,IMAP Host,IMAP Port,SMTP Username,SMTP Password,SMTP Host,SMTP Port,Daily Limit,Warmup Enabled,Warmup Limit,Warmup Increment\n';
    
    const rows = clientInboxes.map(inbox => {
      return [
        inbox.email_address,
        inbox.first_name || '',
        inbox.last_name || '',
        inbox.domains?.domain_name || '',
        inbox.imap_username || '',
        inbox.imap_password || '',
        inbox.imap_host || '',
        inbox.imap_port || '',
        inbox.smtp_username || '',
        inbox.smtp_password || '',
        inbox.smtp_host || '',
        inbox.smtp_port || '',
        '', // Daily Limit - would need to join warmup_accounts
        '', // Warmup Enabled
        '', // Warmup Limit
        ''  // Warmup Increment
      ].join(',');
    }).join('\n');

    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName.replace(/\s+/g, '_')}_inboxes_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  // Group inboxes by client (user)
  const groupedClients: GroupedClient[] = [];
  const clientMap = new Map<string, any[]>();

  inboxes.forEach(inbox => {
    const userId = inbox.user_id;
    if (!clientMap.has(userId)) {
      clientMap.set(userId, []);
    }
    clientMap.get(userId)!.push(inbox);
  });

  clientMap.forEach((clientInboxes, userId) => {
    const firstInbox = clientInboxes[0];
    const uniqueDomains = new Set(clientInboxes.map(inbox => inbox.domains?.domain_name).filter(Boolean));
    
    groupedClients.push({
      userId,
      clientName: firstInbox.profiles?.full_name || 'Unknown Client',
      clientEmail: firstInbox.profiles?.email || '',
      inboxes: clientInboxes,
      totalDomains: uniqueDomains.size
    });
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inbox Management</h1>
            <p className="text-muted-foreground">View and manage all email inboxes</p>
          </div>
          {/* {inboxes.length > 0 && ( */}
            <Button variant="destructive" onClick={handleDeleteAllInboxes}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Inboxes
            </Button>
          {/* )} */}
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Inboxes by Client</CardTitle>
            <CardDescription>All inboxes grouped by client/user</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groupedClients.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">No inboxes found</p>
            ) : (
              <div className="space-y-2">
                {groupedClients.map((client) => (
                  <Collapsible
                    key={client.userId}
                    open={expandedClients.has(client.userId)}
                    onOpenChange={() => toggleClient(client.userId)}
                  >
                    <div className="border border-border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            {expandedClients.has(client.userId) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="flex-1 grid grid-cols-4 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Client Name</div>
                                <div className="font-semibold text-foreground">{client.clientName}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Client Email</div>
                                <div className="font-medium text-foreground text-sm">{client.clientEmail}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Total Domains</div>
                                <div className="font-semibold text-primary">{client.totalDomains}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Total Inboxes</div>
                                <div className="font-semibold text-primary">{client.inboxes.length}</div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadClientCSV(client.inboxes, client.clientName);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email Address</TableHead>
                                <TableHead>Domain</TableHead>
                                <TableHead>Health Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {client.inboxes.map((inbox) => (
                                <TableRow key={inbox.id}>
                                  <TableCell className="font-medium">
                                    {`${inbox.first_name || ''} ${inbox.last_name || ''}`.trim() || '—'}
                                  </TableCell>
                                  <TableCell>{inbox.email_address}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {inbox.domains?.domain_name || '—'}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`font-semibold ${
                                      Number(inbox.health_score) >= 80 ? 'text-green-500' :
                                      Number(inbox.health_score) >= 60 ? 'text-orange-500' :
                                      'text-red-500'
                                    }`}>
                                      {inbox.health_score}%
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      inbox.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {inbox.status}
                                    </span>
                                  </TableCell>
                                  <TableCell>{new Date(inbox.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteInbox(inbox.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminInboxes;