import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const AdminInboxes = () => {
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInboxes();
  }, []);

  const fetchInboxes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inboxes')
      .select(`
        *,
        profiles:user_id (full_name, email),
        domains (domain_name)
      `)
      .order('created_at', { ascending: false });

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inbox Management</h1>
          <p className="text-muted-foreground">View and manage all email inboxes</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>All Inboxes</CardTitle>
            <CardDescription>Monitor inbox health and status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : inboxes.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">No inboxes found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inboxes.map((inbox) => (
                    <TableRow key={inbox.id}>
                      <TableCell className="font-medium">{inbox.email_address}</TableCell>
                      <TableCell>
                        {inbox.profiles?.full_name || inbox.profiles?.email || "—"}
                      </TableCell>
                      <TableCell>{inbox.domains?.domain_name || "—"}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminInboxes;
