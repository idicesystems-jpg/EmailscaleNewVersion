import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestTube, Play } from "lucide-react";

const PlacementTest = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Email Placement Test</h1>
            <p className="text-muted-foreground">Test email delivery and inbox placement</p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-primary-glow">
            <Play className="h-4 w-4 mr-2" />
            Run New Test
          </Button>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <TestTube className="h-5 w-5 mr-2 text-primary" />
              Test Results
            </CardTitle>
            <CardDescription>Recent placement test results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tests run yet. Run your first placement test.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PlacementTest;
