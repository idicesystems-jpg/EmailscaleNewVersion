import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  Trash2,
  Search,
  AlertTriangle,
  Calendar,
  Upload,
  Download,
  UserPlus,
  Globe,
} from "lucide-react";
import {
  useCreateDomainMutation,
  useFetchDomainsQuery,
  useUpdateDomainStatusMutation,
  useDeleteDomainMutation,
  useImportDomainsMutation,
  useLazyExportDomainsCsvQuery,
} from "../../services/adminDomainService";
import { useAllUsersQuery } from "../../services/adminUserService";
import DomainTable from "../../components/DomainTable";
import Pagination from "../../components/Pagination";

const AdminDomains = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data: users } = useAllUsersQuery();

  //console.log("Users data:", users); // Debugging line

  const { data, error, isLoading } = useFetchDomainsQuery({
    page,
    limit,
    search,
  });

  const actualDomainsData = data ? data.data.domains : [];

  //update domain status
  const [updateDomainStatus] = useUpdateDomainStatusMutation();

  const [deleteDomain] = useDeleteDomainMutation();

  //add domain with user creation
  const [createUser, setCreateUser] = useState(false);
  const [createDomain] = useCreateDomainMutation();

  const [formData, setFormData] = useState({
    // Domain Information
    domain_name: "",
    registered: "1",
    purchase_date: "",
    expiry_date: "",
    status: "Active",

    // User Information
    create_new_user: createUser,
    fname: "",
    lname: "",
    email: "",
    password: "",
    phone: "",
    company_name: "",
    user_id: "",
  });

  type ErrorsType = {
    domain_name?: string;
    purchase_date?: string;
    expiry_date?: string;
    registered?: string;
    fname?: string;
    lname?: string;
    email?: string;
    password?: string;
    phone?: string;
    company_name?: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
  };

  const [errors, setErrors] = useState<ErrorsType>({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validate = () => {
    const newErrors: ErrorsType = {};

    // --- Domain Fields ---
    if (!formData.domain_name.trim()) {
      newErrors.domain_name = "Domain name is required";
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    }

    if (!formData.expiry_date) {
      newErrors.expiry_date = "Expiry date is required";
    }

    if (!formData.registered) {
      newErrors.registered = "Registration info is required";
    }

    // --- User Fields ---
    if (formData.create_new_user) {
      if (!formData.fname.trim()) newErrors.fname = "First name is required";
      if (!formData.lname.trim()) newErrors.lname = "Last name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))
        newErrors.email = "Invalid email format";

      if (!formData.password.trim())
        newErrors.password = "Password is required";
      else if (formData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";

      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      else if (!/^[0-9]{10,15}$/.test(formData.phone))
        newErrors.phone = "Invalid phone number";

      if (!formData.company_name.trim())
        newErrors.company_name = "Company name is required";
    } else {
      if (!formData.user_id.trim()) {
        newErrors.user_id = "Please select an existing user";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      domain_name: formData.domain_name,
      purchase_date: formData.purchase_date,
      expiry_date: formData.expiry_date,
      registered: formData.registered,
      fname: formData.fname,
      lname: formData.lname,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      company_name: formData.company_name,
      user_id: formData.user_id,
    };

    try {
      await createDomain(payload).unwrap();
      toast.success("Domain created successfully!");
      setDialogOpen(false);
    } catch (err) {
      toast.error("Failed to create domain");
      console.error(err);
    }
  };

  //add domain with existing user

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("domains")
      .select(
        `
        *,
        profiles:user_id (full_name, email)
      `
      )
      .order("expiry_date", { ascending: true });

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
      .from("domains")
      .delete()
      .eq("id", domainId);

    if (error) {
      toast.error("Error deleting domain");
    } else {
      toast.success("Domain deleted successfully");
      fetchDomains();
    }
  };

  const [exportDomainsCsv, { isFetching }] = useLazyExportDomainsCsvQuery();
  const [selectedIds, setSelectedIds] = useState([]);
  //console.log("selectedIds", selectedIds);
  const handleExportDomainsCsv = async () => {
    try {
      // If selectedIds is empty, backend should export all
      const payload =
        selectedIds.length > 0 ? { selected_ids: selectedIds } : {};

      const response = await exportDomainsCsv(payload).unwrap();

      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        selectedIds.length > 0
          ? "selected_domains_export.csv"
          : "all_domains_export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV Export failed:", error);
      alert("Failed to export domains CSV.");
    }
  };

  const downloadCSVTemplate = () => {
    const template = `domain_name,user_email,registrar,purchase_date,expiry_date,status,notes
example.com,user@example.com,GoDaddy,2024-01-01,2025-01-01,active,Sample domain
mysite.org,user@example.com,Namecheap,2024-02-15,2025-02-15,pending,Another example`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "domains_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const [importDomains] = useImportDomainsMutation();

  const handleCSVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      // Optional: parse headers if needed for validation
      const headers = lines[0].split(",").map((h) => h.trim());
      const errors: string[] = [];

      // Call RTK mutation directly with the file
      try {
        await importDomains(file).unwrap(); // <- your RTK Query mutation
        toast.success(`CSV imported successfully`);
      } catch (mutationError) {
        console.error("Import failed:", mutationError);
        toast.error("Error importing CSV file");
      }
    } catch (error) {
      console.error("CSV reading/parsing error:", error);
      toast.error("Error reading CSV file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // const getDaysUntilExpiry = (expiryDate: string) => {
  //   if (!expiryDate) return null;
  //   const today = new Date();
  //   const expiry = new Date(expiryDate);
  //   const diffTime = expiry.getTime() - today.getTime();
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   return diffDays;
  // };

  // const domainsExpiring30 = domains.filter((d) => {
  //   const days = getDaysUntilExpiry(d.expiry_date);
  //   return days !== null && days > 0 && days <= 30;
  // }).length;

  // const domainsExpiring60 = domains.filter((d) => {
  //   const days = getDaysUntilExpiry(d.expiry_date);
  //   return days !== null && days > 0 && days <= 60;
  // }).length;

  // const expiredDomains = domains.filter((d) => {
  //   const days = getDaysUntilExpiry(d.expiry_date);
  //   return days !== null && days <= 0;
  // }).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Domain Management
          </h1>
          <p className="text-muted-foreground">
            Track domain ownership and expiry dates
          </p>
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
              <div className="text-2xl font-bold text-primary">
                {domains.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">10</div>
            </CardContent>
          </Card>
          <Card className="border-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Expiring in 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">20</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Expiring in 60 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">30</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Domains</CardTitle>
                <CardDescription>
                  Monitor domain status, ownership, and expiry dates
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search domains, users, or registrar..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // Reset page when searching
                    }}
                    className="pl-10"
                  />
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Globe className="h-4 w-4 mr-2" /> Add Domain
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Add New Domain</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={createUser}
                          onChange={(e) => setCreateUser(e.target.checked)}
                        />
                        <Label>Create new user</Label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Domain Information */}
                        <div>
                          <h3 className="font-semibold mb-2">
                            Domain Information
                          </h3>
                          <Label>Domain Name</Label>
                          <Input
                            name="domain_name"
                            value={formData.domain_name}
                            onChange={handleInputChange}
                          />
                          {errors.domain_name && (
                            <p className="text-red-500 text-sm">
                              {errors.domain_name}
                            </p>
                          )}

                          <Label>
                            Select Existing User (based on previous domain
                            entries)
                          </Label>
                          <select
                            name="user_id"
                            value={formData.user_id || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 w-full"
                          >
                            <option value="">Select...</option>
                            {users?.users?.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.fname} {user.lname} ({user.email})
                              </option>
                            ))}
                          </select>
                          {errors.user_id && (
                            <p className="text-red-500 text-sm">
                              {errors.user_id}
                            </p>
                          )}

                          <Label>Purchase Date</Label>
                          <Input
                            type="date"
                            name="purchase_date"
                            value={formData.purchase_date}
                            onChange={handleInputChange}
                          />
                          {errors.purchase_date && (
                            <p className="text-red-500 text-sm">
                              {errors.purchase_date}
                            </p>
                          )}

                          <Label>Expiry Date</Label>
                          <Input
                            type="date"
                            name="expiry_date"
                            value={formData.expiry_date}
                            onChange={handleInputChange}
                          />
                          {errors.expiry_date && (
                            <p className="text-red-500 text-sm">
                              {errors.expiry_date}
                            </p>
                          )}

                          <Label>Status</Label>

                          <select
                            name="registered"
                            value={formData.registered}
                            onChange={handleInputChange}
                            className="w-full border rounded-md p-2"
                          >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </select>
                        </div>

                        {/* User Information */}
                        {createUser && (
                          <div>
                            <h3 className="font-semibold mb-2">
                              User Information
                            </h3>
                            <Label>First Name</Label>
                            <Input
                              name="fname"
                              value={formData.fname}
                              onChange={handleInputChange}
                            />
                            {errors.fname && (
                              <p className="text-red-500 text-sm">
                                {errors.fname}
                              </p>
                            )}

                            <Label>Last Name</Label>
                            <Input
                              name="lname"
                              value={formData.lname}
                              onChange={handleInputChange}
                            />
                            {errors.lname && (
                              <p className="text-red-500 text-sm">
                                {errors.lname}
                              </p>
                            )}

                            <Label>Email</Label>
                            <Input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                            {errors.email && (
                              <p className="text-red-500 text-sm">
                                {errors.email}
                              </p>
                            )}

                            <Label>Password</Label>
                            <Input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                            />
                            {errors.password && (
                              <p className="text-red-500 text-sm">
                                {errors.password}
                              </p>
                            )}

                            <Label>Phone</Label>
                            <Input
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                            />

                            <Label>Company Name</Label>
                            <Input
                              name="company_name"
                              value={formData.company_name}
                              onChange={handleInputChange}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                          {isLoading ? "Saving..." : "Add Domain"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCSVTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
                <Dialog
                  open={uploadDialogOpen}
                  onOpenChange={setUploadDialogOpen}
                >
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
                        Upload a CSV file to import multiple domains at once.
                        Download the template to see the required format.
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
                          className={`cursor-pointer ${
                            uploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {uploading
                              ? "Uploading..."
                              : "Click to upload CSV file"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            CSV format: domain_name, user_email, registrar,
                            purchase_date, expiry_date, status, notes
                          </p>
                        </label>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          <strong>Required fields:</strong> domain_name,
                          user_email
                        </p>
                        <p>
                          <strong>Optional fields:</strong> registrar,
                          purchase_date, expiry_date, status, notes
                        </p>
                        <p>
                          <strong>Date format:</strong> YYYY-MM-DD
                        </p>
                        <p>
                          <strong>Status values:</strong> active, pending,
                          expired
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportDomainsCsv}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DomainTable
              domainsData={actualDomainsData}
              updateDomainStatus={updateDomainStatus}
              deleteDomain={deleteDomain}
              exportDomainsCsv={exportDomainsCsv}
              setSelectedIds={setSelectedIds}
            />
            {/* Pagination Controls */}
            <Pagination page={page} setPage={setPage} limit={limit} total={data?.total} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDomains;
