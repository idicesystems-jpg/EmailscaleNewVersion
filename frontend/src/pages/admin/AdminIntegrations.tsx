import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Edit, TestTube, Link as LinkIcon, Webhook, Code, Send, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const AdminIntegrations = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "api",
    description: "",
    api_url: "",
    api_key: "",
    webhook_secret: "",
    headers: "{}",
    is_active: true
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error fetching integrations");
      console.error(error);
    } else {
      setIntegrations(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON headers
    try {
      JSON.parse(formData.headers);
    } catch {
      toast.error("Invalid JSON in headers field");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const integrationData = {
      ...formData,
      headers: JSON.parse(formData.headers),
      created_by: user.id
    };

    if (editingIntegration) {
      const { error } = await supabase
        .from('admin_integrations')
        .update(integrationData)
        .eq('id', editingIntegration.id);

      if (error) {
        toast.error("Error updating integration");
        console.error(error);
      } else {
        toast.success("Integration updated successfully");
        setDialogOpen(false);
        resetForm();
        fetchIntegrations();
      }
    } else {
      const { error } = await supabase
        .from('admin_integrations')
        .insert([integrationData]);

      if (error) {
        toast.error("Error creating integration");
        console.error(error);
      } else {
        toast.success("Integration created successfully");
        setDialogOpen(false);
        resetForm();
        fetchIntegrations();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "api",
      description: "",
      api_url: "",
      api_key: "",
      webhook_secret: "",
      headers: "{}",
      is_active: true
    });
    setEditingIntegration(null);
  };

  const handleEdit = (integration: any) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      type: integration.type,
      description: integration.description || "",
      api_url: integration.api_url,
      api_key: integration.api_key || "",
      webhook_secret: integration.webhook_secret || "",
      headers: JSON.stringify(integration.headers || {}, null, 2),
      is_active: integration.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) return;

    const { error } = await supabase
      .from('admin_integrations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Error deleting integration");
    } else {
      toast.success("Integration deleted successfully");
      fetchIntegrations();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('admin_integrations')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error("Error updating status");
    } else {
      toast.success(`Integration ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchIntegrations();
    }
  };

  const handleTest = async (integration: any) => {
    toast.info("Testing integration...");
    
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        ...(integration.headers || {})
      };
      
      if (integration.api_key) {
        headers['Authorization'] = `Bearer ${integration.api_key}`;
      }

      const response = await fetch(integration.api_url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      });

      await supabase
        .from('admin_integrations')
        .update({
          last_tested_at: new Date().toISOString(),
          test_status: response.ok ? 'success' : 'failed'
        })
        .eq('id', integration.id);

      if (response.ok) {
        toast.success("Integration test successful");
      } else {
        toast.error(`Integration test failed: ${response.status}`);
      }
      
      fetchIntegrations();
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
      await supabase
        .from('admin_integrations')
        .update({
          last_tested_at: new Date().toISOString(),
          test_status: 'failed'
        })
        .eq('id', integration.id);
      fetchIntegrations();
    }
  };

  const handleSendToIntegration = async (integration: any) => {
    setSending(true);
    toast.info(`Sending warmup pool data to ${integration.name}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('integration-api', {
        body: {
          action: 'sync_warmup_accounts',
          integrationId: integration.id,
          data: {
            message: 'Syncing warmup accounts with integration'
          }
        }
      });

      if (error) throw error;

      toast.success(`Successfully sent ${data.accounts_used} warmup accounts to ${integration.name}`);
    } catch (error: any) {
      console.error('Error sending to integration:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'highlevel':
        return <Code className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      default:
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'highlevel':
        return 'bg-purple-500/20 text-purple-500';
      case 'webhook':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-green-500/20 text-green-500';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Integrations</h1>
            <p className="text-muted-foreground">Manage API integrations, webhooks, and external services</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingIntegration ? 'Edit' : 'Add'} Integration</DialogTitle>
                <DialogDescription>
                  Configure API connections, webhooks, and external service integrations
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Integration Name*</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., HighLevel CRM"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type*</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highlevel">HighLevel CRM</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="api">Generic API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this integration"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_url">API URL / Webhook URL*</Label>
                  <Input
                    id="api_url"
                    type="url"
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    placeholder="https://api.example.com/endpoint"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key / Token</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Your API key or bearer token"
                  />
                </div>

                {formData.type === 'webhook' && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook_secret">Webhook Secret</Label>
                    <Input
                      id="webhook_secret"
                      type="password"
                      value={formData.webhook_secret}
                      onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                      placeholder="Webhook signing secret"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="headers">Custom Headers (JSON)</Label>
                  <Textarea
                    id="headers"
                    value={formData.headers}
                    onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                    placeholder='{"X-Custom-Header": "value"}'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Additional headers as JSON object</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingIntegration ? 'Update' : 'Create'} Integration
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{integrations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {integrations.filter(i => i.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {integrations.filter(i => !i.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>All Integrations</CardTitle>
            <CardDescription>Manage your external API connections and webhooks</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : integrations.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">No integrations configured</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Tested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          {integration.description && (
                            <p className="text-xs text-muted-foreground">{integration.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(integration.type)}>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(integration.type)}
                            {integration.type}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono max-w-[200px] truncate block" title={integration.api_url}>
                          {integration.api_url}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={integration.is_active}
                            onCheckedChange={() => handleToggleActive(integration.id, integration.is_active)}
                          />
                          {integration.test_status && (
                            <Badge variant={integration.test_status === 'success' ? 'default' : 'destructive'}>
                              {integration.test_status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {integration.last_tested_at ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(integration.last_tested_at).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendToIntegration(integration)}
                            title="Send Warmup Pool to API"
                            disabled={sending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(integration)}
                            title="Test Integration"
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(integration)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(integration.id)}
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
      </div>
    </AdminLayout>
  );
};

export default AdminIntegrations;