import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkIcon, CheckCircle, Plus } from "lucide-react";

const Integrations = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
          <p className="text-muted-foreground">Connect and manage your third-party integrations</p>
        </div>

        <Tabs defaultValue="highlevel" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="highlevel">Highlevel</TabsTrigger>
            <TabsTrigger value="instantly">Instantly</TabsTrigger>
            <TabsTrigger value="smartlead">Smartlead</TabsTrigger>
          </TabsList>

          {/* Highlevel Tab */}
          <TabsContent value="highlevel" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Highlevel Integration</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your Highlevel account connections</p>
              </div>
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <LinkIcon className="h-5 w-5 mr-2 text-primary" />
                  Active Connections
                </CardTitle>
                <CardDescription>Your Highlevel account connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No connections yet. Add your first Highlevel connection.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instantly Tab */}
          <TabsContent value="instantly" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Instantly.ai Integration</h2>
              <p className="text-sm text-muted-foreground mt-1">Connect your Instantly.ai account to sync your email campaigns</p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    <CardTitle>Connect Instantly.ai</CardTitle>
                  </div>
                  <CardDescription>
                    Enter your Instantly API credentials to establish connection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instantly-api-key">API Key</Label>
                    <Input
                      id="instantly-api-key"
                      type="password"
                      placeholder="Enter your Instantly API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instantly-account-id">Account ID</Label>
                    <Input
                      id="instantly-account-id"
                      placeholder="Enter your account ID"
                    />
                  </div>
                  <Button className="w-full">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect Account
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>
                    Your current connection status with Instantly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <span>Not connected</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Smartlead Tab */}
          <TabsContent value="smartlead" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Smartlead Integration</h2>
              <p className="text-sm text-muted-foreground mt-1">Connect your Smartlead account to manage your lead generation</p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    <CardTitle>Connect Smartlead</CardTitle>
                  </div>
                  <CardDescription>
                    Enter your Smartlead API credentials to establish connection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smartlead-api-key">API Key</Label>
                    <Input
                      id="smartlead-api-key"
                      type="password"
                      placeholder="Enter your Smartlead API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smartlead-workspace-id">Workspace ID</Label>
                    <Input
                      id="smartlead-workspace-id"
                      placeholder="Enter your workspace ID"
                    />
                  </div>
                  <Button className="w-full">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect Account
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>
                    Your current connection status with Smartlead
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <span>Not connected</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Integrations;
