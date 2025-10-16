import { useState } from "react";
import { Globe, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Domain {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string | null;
  user_id: string;
  domain: string;
  order_id: string | null;
  expiry_date: string;
  purchase_date: string;
  registered: number;
  domain_type: string;
  request_info: string;
  created_at: string;
}

interface GroupedDomains {
  [userId: string]: Domain[];
}

interface DomainTableProps {
  domainsData: GroupedDomains;
}

 const DomainTable = ({ domainsData }: DomainTableProps) => {

  console.log("domainsData:", domainsData); // Debugging line
  const [selectedDomains, setSelectedDomains] = useState<number[]>([]);
  const [domainStatuses, setDomainStatuses] = useState<Record<number, number>>({});
  const { toast } = useToast();

  const extractDomainNames = (domains: Domain[]): string[] => {
    const domainNames: string[] = [];

    domains.forEach((domain) => {
      try {
        const requestInfo = JSON.parse(domain.request_info);
        
        if (requestInfo.result && Array.isArray(requestInfo.result)) {
          requestInfo.result.forEach((value: string) => {
            if (value && value.trim()) {
              domainNames.push(value);
            }
          });
        } else if (requestInfo.domain_name && requestInfo.domain_name.trim()) {
          domainNames.push(requestInfo.domain_name);
        }
      } catch (error) {
        console.error("Error parsing request_info:", error);
      }
    });

    return [...new Set(domainNames)];
  };

  const handleCheckboxChange = (domainId: number) => {
    setSelectedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId]
    );
  };

  const handleStatusChange = (domainId: number, newStatus: string) => {
    const statusValue = newStatus === "active" ? 1 : 0;
    setDomainStatuses((prev) => ({ ...prev, [domainId]: statusValue }));
    toast({
      title: "Status Updated",
      description: `Domain status updated to ${newStatus}`,
    });
  };

  const handleRegister = (orderId: string | null) => {
    if (orderId) {
      toast({
        title: "Domain Registration",
        description: "Registering domain...",
      });
    }
  };

  const handleDelete = (domainId: number) => {
    if (window.confirm("Are you sure you want to delete this domain?")) {
      toast({
        title: "Domain Deleted",
        description: "Domain deleted successfully",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-md">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Domain
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              User
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Purchase Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Expiry Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Object.entries(domainsData).map(([userId, userDomains]) => {
            const firstDomain = userDomains[0];
            const domainNames = extractDomainNames(userDomains);
            const currentStatus = domainStatuses[firstDomain.id] ?? firstDomain.registered;

            return (
              <tr
                key={firstDomain.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedDomains.includes(firstDomain.id)}
                      onCheckedChange={() => handleCheckboxChange(firstDomain.id)}
                      className="mt-1"
                    />
                    <div className="flex flex-col gap-2">
                      {domainNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {firstDomain.fname} {firstDomain.lname}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {firstDomain.email}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">
                    {formatDate(firstDomain.purchase_date || firstDomain.created_at)}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">
                    {formatDate(firstDomain.expiry_date)}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <Select
                    value={currentStatus === 1 ? "active" : "inactive"}
                    onValueChange={(value) => handleStatusChange(firstDomain.id, value)}
                  >
                    <SelectTrigger
                      className={`w-32 rounded-full border-0 font-medium ${
                        currentStatus === 1
                          ? "bg-success-light text-success-dark"
                          : "bg-destructive-light text-destructive-dark"
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {currentStatus === 1 && firstDomain.domain_type === "auto" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-9 w-9"
                      >
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    ) : (
                      <>
                        {currentStatus === 0 && firstDomain.domain_type === "auto" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRegister(firstDomain.order_id)}
                            className="h-9 w-9 hover:bg-primary-light hover:text-primary"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {currentStatus === 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(firstDomain.id)}
                            className="h-9 w-9 hover:bg-destructive-light hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DomainTable;
