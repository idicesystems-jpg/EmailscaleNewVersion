import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PoolAccount {
  email_address: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  provider: string;
}

interface ValidationResult {
  account: PoolAccount;
  valid: boolean;
  errors: string[];
  rowNumber: number;
}

interface BulkUploadWarmupPoolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveEmailNew: any;
}

export function BulkUploadWarmupPool({ open, onOpenChange,saveEmailNew }: BulkUploadWarmupPoolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  console.log("saveEmailNew:", file);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePort = (port: any): boolean => {
    const portNum = Number(port);
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535 && Number.isInteger(portNum);
  };

  const detectProvider = (email: string): string => {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail')) return 'gmail';
    if (domain.includes('yahoo')) return 'yahoo';
    if (domain.includes('aol')) return 'aol';
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) return 'microsoft';
    return 'other';
  };

  const validateAccount = (account: Partial<PoolAccount>, rowNumber: number): ValidationResult => {
    const errors: string[] = [];

    // Required field validation
    if (!account.email_address?.trim()) {
      errors.push("Email is required");
    } else if (!validateEmail(account.email_address)) {
      errors.push("Invalid email format");
    }

    if (!account.imap_username?.trim()) {
      errors.push("IMAP Username is required");
    }

    if (!account.imap_password?.trim()) {
      errors.push("IMAP Password is required");
    }

    if (!account.imap_host?.trim()) {
      errors.push("IMAP Host is required");
    }

    if (!account.imap_port) {
      errors.push("IMAP Port is required");
    } else if (!validatePort(account.imap_port)) {
      errors.push("IMAP Port must be a valid port number (1-65535)");
    }

    // Build valid account object
    const validAccount: PoolAccount = {
      email_address: account.email_address?.trim() || '',
      imap_host: account.imap_host?.trim() || '',
      imap_port: Number(account.imap_port) || 993,
      imap_username: account.imap_username?.trim() || '',
      imap_password: account.imap_password?.trim() || '',
      provider: detectProvider(account.email_address?.trim() || ''),
      smtp_host: account.smtp_host?.trim(),
      smtp_port: account.smtp_port ? Number(account.smtp_port) : undefined,
      smtp_username: account.smtp_username?.trim(),
      smtp_password: account.smtp_password?.trim(),
    };

    return {
      account: validAccount,
      valid: errors.length === 0,
      errors,
      rowNumber
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    //setIsValidating(true);
    //setValidationResults([]);

    // try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast.error("File is empty");
        //setIsValidating(false);
        return;
      }

      // Skip header row and parse data
      const dataLines = lines.slice(1);
      const results: ValidationResult[] = [];

      // dataLines.forEach((line, index) => {
      //   const columns = line.split('\t').map(col => col.trim());
        
        // if (columns.length < 7) {
        //   results.push({
        //     account: {} as PoolAccount,
        //     valid: false,
        //     errors: ["Insufficient columns - expected 7 columns (Email, First Name, Last Name, IMAP Username, IMAP Password, IMAP Host, IMAP Port)"],
        //     rowNumber: index + 2
        //   });
        //   return;
        // }

        //const [email, firstName, lastName, imapUsername, imapPassword, imapHost, imapPort] = columns;

        // const result = validateAccount({
        //   email_address: email,
        //   imap_username: imapUsername,
        //   imap_password: imapPassword,
        //   imap_host: imapHost,
        //   imap_port: Number(imapPort)
        // }, index + 2);

        // results.push(result);
      // });

      //setValidationResults(results);
      
      //const validCount = results.filter(r => r.valid).length;
      //const invalidCount = results.filter(r => !r.valid).length;
      
      //toast.success(`Validation complete: ${validCount} valid, ${invalidCount} invalid`);
    // } catch (error) {
    //   toast.error("Error reading file");
    //   console.error(error);
    // } finally {
    //   setIsValidating(false);
    // }
  };

  const handleUpload = async () => {
   // const validAccounts = validationResults.filter(r => r.valid).map(r => r.account);
    
    // if (validAccounts.length === 0) {
    //   toast.error("No valid accounts to upload");
    //   return;
    // }

    //setIsUploading(true);

    try {
      // const { error } = await supabase
      //   .from('warmup_pool')
      //   .insert(validAccounts);

      // if (error) throw error;

      await saveEmailNew(file).unwrap(); // <- your RTK Query mutation

      toast.success(`Successfully uploaded accounts`);
      //onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast.error("Error uploading accounts: " + error.message);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setValidationResults([]);
  };

  //const validCount = validationResults.filter(r => r.valid).length;
  //const invalidCount = validationResults.filter(r => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Warmup Pool Accounts</DialogTitle>
          <DialogDescription>
            Upload a tab-separated file with columns: Email, First Name, Last Name, IMAP Username, IMAP Password, IMAP Host, IMAP Port
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".txt,.csv,.tsv"
              onChange={handleFileChange}
              disabled={isValidating || isUploading}
            />
            {file && (
              <div className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          {/* {validationResults.length > 0 && (
            <>
              <div className="flex gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-semibold text-green-700 dark:text-green-400">{validCount} Valid</div>
                    <div className="text-xs text-muted-foreground">Ready to upload</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-semibold text-red-700 dark:text-red-400">{invalidCount} Invalid</div>
                    <div className="text-xs text-muted-foreground">Will not be uploaded</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>IMAP Host</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.map((result, index) => (
                      <TableRow key={index} className={result.valid ? '' : 'bg-red-50 dark:bg-red-950/20'}>
                        <TableCell className="font-mono text-xs">{result.rowNumber}</TableCell>
                        <TableCell>
                          {result.valid ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{result.account.email_address || '-'}</TableCell>
                        <TableCell className="text-sm">{result.account.imap_host || '-'}</TableCell>
                        <TableCell className="text-sm">{result.account.imap_port || '-'}</TableCell>
                        <TableCell>
                          {result.errors.length > 0 ? (
                            <div className="flex items-start gap-1">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-red-600 dark:text-red-400">
                                {result.errors.join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-green-600 dark:text-green-400">No issues</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )} */}

          {/* {validationResults.length > 0 && validCount > 0 && ( */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : `Upload`}
              </Button>
            </div>
          {/* )} */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
