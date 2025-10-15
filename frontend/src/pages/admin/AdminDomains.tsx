import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Search, AlertTriangle, Calendar, Upload, Download } from "lucide-react";

const AdminDomains = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('domains')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order('expiry_date', { ascending: true });

    if (error) {
      toast.error("Error fetching domains");
      console.error(error);
    } else {
      setDomains(data || []);
    }
    setLoading(false);
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return;

    const { error } = await supabase
      .from('domains')
      .delete()
      .eq('id', domainId);

    if (error) {
      toast.error("Error deleting domain");
    } else {
      toast.success("Domain deleted successfully");
      fetchDomains();
    }
  };

  const downloadCSVTemplate = () => {
    const template = `domain_name,user_email,registrar,purchase_date,expiry_date,status,notes
example.com,user@example.com,GoDaddy,2024-01-01,2025-01-01,active,Sample domain
mysite.org,user@example.com,Namecheap,2024-02-15,2025-02-15,pending,Another example`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domains_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const domains: any[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Line ${i + 1}: Invalid number of columns`);
          continue;
        }

        const domain: any = {};
        headers.forEach((header, index) => {
          domain[header] = values[index];
        });

        // Validate required fields
        if (!domain.domain_name) {
          errors.push(`Line ${i + 1}: Missing domain_name`);
          continue;
        }
        if (!domain.user_email) {
          errors.push(`Line ${i + 1}: Missing user_email`);
          continue;
        }

        // Find user by email
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', domain.user_email)
          .maybeSingle();

        if (userError || !userData) {
          errors.push(`Line ${i + 1}: User with email ${domain.user_email} not found`);
          continue;
        }

        domains.push({
          domain_name: domain.domain_name,
          user_id: userData.id,
          registrar: domain.registrar || null,
          purchase_date: domain.purchase_date || null,
          expiry_date: domain.expiry_date || null,
          status: domain.status || 'pending',
          notes: domain.notes || null
        });
      }

      if (domains.length === 0) {
        toast.error("No valid domains to import");
        if (errors.length > 0) {
          console.error("Import errors:", errors);
        }
        return;
      }

      // Bulk insert
      const { error: insertError } = await supabase
        .from('domains')
        .insert(domains);

      if (insertError) {
        toast.error("Error importing domains");
        console.error(insertError);
      } else {
        toast.success(`Successfully imported ${domains.length} domain${domains.length > 1 ? 's' : ''}`);
        if (errors.length > 0) {
          toast.warning(`${errors.length} row${errors.length > 1 ? 's' : ''} skipped due to errors`);
        }
        setUploadDialogOpen(false);
        fetchDomains();
      }
    } catch (error) {
      console.error("CSV parsing error:", error);
      toast.error("Error parsing CSV file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredDomains = domains.filter(domain => {
    const query = searchQuery.toLowerCase();
    return (
      domain.domain_name?.toLowerCase().includes(query) ||
      domain.profiles?.full_name?.toLowerCase().includes(query) ||
      domain.profiles?.email?.toLowerCase().includes(query) ||
      domain.registrar?.toLowerCase().includes(query)
    );
  });

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const domainsExpiring30 = domains.filter(d => {
    const days = getDaysUntilExpiry(d.expiry_date);
    return days !== null && days > 0 && days <= 30;
  }).length;

  const domainsExpiring60 = domains.filter(d => {
    const days = getDaysUntilExpiry(d.expiry_date);
    return days !== null && days > 0 && days <= 60;
  }).length;

  const expiredDomains = domains.filter(d => {
    const days = getDaysUntilExpiry(d.expiry_date);
    return days !== null && days <= 0;
  }).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Domain Management</h1>
          <p className="text-muted-foreground">Track domain ownership and expiry dates</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{domains.length}</div>
            </CardContent>
          </Card>
          <Card className={expiredDomains > 0 ? "border-red-500" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{expiredDomains}</div>
            </CardContent>
          </Card>
          <Card className={domainsExpiring30 > 0 ? "border-orange-500" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Expiring in 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{domainsExpiring30}</div>
            </CardContent>
          </Card>
          <Card className={domainsExpiring60 > 0 ? "border-yellow-500" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Expiring in 60 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{domainsExpiring60}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Domains</CardTitle>
                <CardDescription>Monitor domain status, ownership, and expiry dates</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search domains, users, or registrar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadCSVTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Upload Domains</DialogTitle>
                      <DialogDescription>
                        Upload a CSV file to import multiple domains at once. Download the template to see the required format.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          disabled={uploading}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label 
                          htmlFor="csv-upload" 
                          className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {uploading ? 'Uploading...' : 'Click to upload CSV file'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            CSV format: domain_name, user_email, registrar, purchase_date, expiry_date, status, notes
                          </p>
                        </label>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>Required fields:</strong> domain_name, user_email</p>
                        <p><strong>Optional fields:</strong> registrar, purchase_date, expiry_date, status, notes</p>
                        <p><strong>Date format:</strong> YYYY-MM-DD</p>
                        <p><strong>Status values:</strong> active, pending, expired</p>
                      </div>
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
            ) : filteredDomains.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                {searchQuery ? "No domains found matching your search" : "No domains found"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Registrar</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Until Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDomains.map((domain) => {
                    const daysUntilExpiry = getDaysUntilExpiry(domain.expiry_date);
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 60;
                    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
                    
                    return (
                      <TableRow 
                        key={domain.id}
                        className={
                          isExpired ? 'bg-red-500/10' :
                          daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'bg-orange-500/10' :
                          isExpiringSoon ? 'bg-yellow-500/10' : ''
                        }
                      >
                        <TableCell className="font-medium">{domain.domain_name}</TableCell>
                        <TableCell>
                          {domain.profiles?.full_name || domain.profiles?.email || "—"}
                        </TableCell>
                        <TableCell>{domain.registrar || "—"}</TableCell>
                        <TableCell>
                          {domain.purchase_date ? new Date(domain.purchase_date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          {domain.expiry_date ? new Date(domain.expiry_date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          {daysUntilExpiry !== null ? (
                            <span className={`font-medium ${
                              isExpired ? 'text-red-500' :
                              daysUntilExpiry <= 30 ? 'text-orange-500' :
                              daysUntilExpiry <= 60 ? 'text-yellow-500' :
                              'text-foreground'
                            }`}>
                              {isExpired ? 'Expired' : `${daysUntilExpiry} days`}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            domain.status === 'active' ? 'bg-green-500/20 text-green-500' :
                            domain.status === 'pending' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {domain.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDomain(domain.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDomains;
