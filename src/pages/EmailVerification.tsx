import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload } from "lucide-react";

const EmailVerification = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Email Verification</h1>
            <p className="text-muted-foreground">Verify email addresses for deliverability</p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-primary-glow">
            <Upload className="h-4 w-4 mr-2" />
            Upload List
          </Button>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Verification History
            </CardTitle>
            <CardDescription>Your email verification results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No verifications yet. Upload your first email list.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmailVerification;
