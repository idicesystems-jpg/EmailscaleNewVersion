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
  CheckCircle,
  Upload,
  Clock,
  AlertCircle,
  FileText,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface VerificationJob {
  id: string;
  file_name: string;
  status: string;
  total_emails: number;
  processed_emails: number;
  valid_emails: number;
  invalid_emails: number;
  created_at: string;
  completed_at: string | null;
}

const EmailVerification = () => {
  const [jobs, setJobs] = useState<VerificationJob[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJobs();

    // Subscribe to job updates
    const channel = supabase
      .channel("verification-jobs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_verification_jobs",
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchJobs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("email_verification_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return;
    }

    setJobs(data || []);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("email-verifications")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create job record
      const { error: jobError } = await supabase
        .from("email_verification_jobs")
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_name: file.name,
          status: "pending",
        });

      if (jobError) throw jobError;

      // Trigger processing
      supabase.functions.invoke("process-email-verification");

      toast({
        title: "Upload successful",
        description:
          "Your file is being processed. This will take 15-20 minutes for 20,000 emails.",
      });

      fetchJobs();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> =
      {
        pending: { variant: "secondary", icon: Clock, label: "Pending" },
        processing: { variant: "default", icon: Clock, label: "Processing" },
        completed: {
          variant: "default",
          icon: CheckCircle,
          label: "Completed",
        },
        failed: { variant: "destructive", icon: AlertCircle, label: "Failed" },
      };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getProgress = (job: VerificationJob) => {
    if (job.total_emails === 0) return 0;
    return (job.processed_emails / job.total_emails) * 100;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Email Verification
            </h1>
            <p className="text-muted-foreground">
              Verify email addresses for deliverability
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload CSV"}
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">How It Works</CardTitle>
            <CardDescription>
              Simple 3-step process to verify your email list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">
                  1. Upload Your CSV
                </h3>
                <p className="text-sm text-muted-foreground">
                  Click the "Upload CSV" button and select your email list. The
                  file should contain email addresses in the first column.
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">2. Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Our system verifies each email address. Processing takes
                  approximately 15-20 minutes for 20,000 emails.
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">
                  3. Email Results
                </h3>
                <p className="text-sm text-muted-foreground">
                  Once complete, you'll receive detailed results via email to
                  your registered address with valid and invalid counts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Verification History
            </CardTitle>
            <CardDescription>Your email verification results</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No verifications yet. Upload your first email list.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="bg-background/50">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {job.file_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(job.created_at).toLocaleString()}
                            </p>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>

                        {job.status === "processing" && (
                          <div className="space-y-2">
                            <Progress value={getProgress(job)} />
                            <p className="text-sm text-muted-foreground">
                              {job.processed_emails} / {job.total_emails} emails
                              processed
                            </p>
                          </div>
                        )}

                        {job.status === "completed" && (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-semibold text-foreground">
                                {job.total_emails}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Valid</p>
                              <p className="font-semibold text-green-600">
                                {job.valid_emails}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Invalid</p>
                              <p className="font-semibold text-destructive">
                                {job.invalid_emails}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmailVerification;
