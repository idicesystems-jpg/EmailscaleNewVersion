import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Server, 
  Activity, 
  Globe, 
  Shield, 
  TrendingUp, 
  Cpu,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AdminServerMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Expandable sections state
  const [blacklistBreakdownOpen, setBlacklistBreakdownOpen] = useState(false);
  const [blacklistedIPsOpen, setBlacklistedIPsOpen] = useState(false);
  const [warningDomainsOpen, setWarningDomainsOpen] = useState(false);
  const [criticalDomainsOpen, setCriticalDomainsOpen] = useState(false);

  // Mock data - replace with real API calls
  const systemStatus = {
    overall: "GREEN",
    queueHealth: "GREEN",
    domainHealth: "YELLOW",
    ipReputation: "RED",
    sendingRate: "GREEN",
    serverPerformance: "GREEN"
  };

  const metrics = {
    sentToday: 113258,
    sentWeek: 1026957,
    sentMonth: 4241367,
    queueCount: 419
  };

  const queueByAge = {
    "0-6h": { count: 6, percentage: 1.4 },
    "6-36h": { count: 212, percentage: 50.6 },
    "3-7d": { count: 201, percentage: 48.0 },
    "8+d": { count: 0, percentage: 0 }
  };

  const queueByProvider = {
    yahoo: 98,
    gmail: 111,
    outlook: 0,
    other: 210
  };

  const ipReputation = {
    totalIPs: 165,
    cleanIPs: 11,
    blacklistedIPs: 154,
    blacklistPercentage: 93.3
  };

  const rblBreakdown = [
    { name: "Spamhaus ZEN", count: 45 },
    { name: "SpamCop", count: 32 },
    { name: "SORBS", count: 28 },
    { name: "Barracuda", count: 15 },
    { name: "PSBL", count: 12 },
    { name: "UCEPROTECT-1", count: 8 },
    { name: "UCEPROTECT-2", count: 5 },
    { name: "UCEPROTECT-3", count: 4 },
    { name: "Mailspike", count: 3 },
    { name: "DroneBL", count: 2 }
  ];

  const blacklistedIPs = [
    { ip: "192.168.1.100", blacklists: "Spamhaus ZEN, SpamCop, SORBS" },
    { ip: "192.168.1.101", blacklists: "Barracuda, PSBL" },
    { ip: "192.168.1.102", blacklists: "UCEPROTECT-1, Mailspike" }
  ];

  const domainHealth = {
    totalDomains: 1613,
    healthyDomains: 1503,
    warningDomains: 1,
    criticalDomains: 109,
    healthPercentage: 93.2
  };

  const warningDomains = [
    { domain: "example1.com", missingRecords: "SPF" }
  ];

  const criticalDomains = [
    { domain: "example2.com", missingRecords: "SPF, DKIM" },
    { domain: "example3.com", missingRecords: "SPF, DMARC" }
  ];

  const providerPerformance = [
    { provider: "Yahoo / AOL", successRate: 15, sent: 832, deferred: 4548 },
    { provider: "Gmail", successRate: 99, sent: 21182, deferred: 106 },
    { provider: "Outlook / Hotmail", successRate: 98, sent: 7208, deferred: 104 },
    { provider: "Other Domains", successRate: 100, sent: 83710, deferred: 0 }
  ];

  const serverHealth = {
    cpuUsage: 2.3,
    ramUsage: 37,
    diskUsage: 10,
    eximStatus: "active",
    uptime: "2 days, 12 hours, 37 minutes"
  };

  const bounceStats = {
    hardBounces: 0,
    softBounces: 132,
    totalBounces: 132,
    bounceRate: 0.1
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 2 minutes
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
      }, 120000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch real data here
    setLastUpdated(new Date());
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GREEN": return "bg-green-500/20 text-green-500 border-green-500/50";
      case "YELLOW": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "RED": return "bg-red-500/20 text-red-500 border-red-500/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const downloadCSV = (type: string) => {
    toast.success(`Downloading ${type} CSV...`);
    // Implement CSV download logic
  };

  const StatusBadge = ({ icon: Icon, label, status }: any) => (
    <Badge variant="outline" className={`px-4 py-2 ${getStatusColor(status)}`}>
      <Icon className="h-4 w-4 mr-2" />
      <span className="font-medium">{label}</span>
      <span className="ml-2 font-bold">{status}</span>
    </Badge>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Email Server Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Updates every 2 minutes
              </span>
              <span className="mx-2">•</span>
              Last: {lastUpdated.toLocaleString()}
            </p>
          </div>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Top Status Bar */}
        <div className="flex flex-wrap gap-3">
          <StatusBadge icon={Server} label="System" status={systemStatus.overall} />
          <StatusBadge icon={Activity} label="Queue" status={systemStatus.queueHealth} />
          <StatusBadge icon={Globe} label="Domains" status={systemStatus.domainHealth} />
          <StatusBadge icon={Shield} label="IP Reputation" status={systemStatus.ipReputation} />
          <StatusBadge icon={TrendingUp} label="Sending" status={systemStatus.sendingRate} />
          <StatusBadge icon={Cpu} label="Server" status={systemStatus.serverPerformance} />
        </div>

        {/* Big Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Last Hour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">669</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{metrics.sentToday.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Week (Est)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{metrics.sentWeek.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Month (Est)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{metrics.sentMonth.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue by Age */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Queue by Age
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">0-6 hours</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green-500">{queueByAge["0-6h"].count}</span>
                  <span className="text-xs text-muted-foreground">{queueByAge["0-6h"].percentage}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">6-36 hours</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{queueByAge["6-36h"].count}</span>
                  <span className="text-xs text-muted-foreground">{queueByAge["6-36h"].percentage}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">3-7 days</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{queueByAge["3-7d"].count}</span>
                  <span className="text-xs text-muted-foreground">{queueByAge["3-7d"].percentage}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">8+ days</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-500">{queueByAge["8+d"].count}</span>
                  <span className="text-xs text-muted-foreground">{queueByAge["8+d"].percentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue by Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Queue by Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Yahoo</span>
                </div>
                <span className="text-lg font-bold">{queueByProvider.yahoo}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Gmail</span>
                </div>
                <span className="text-lg font-bold">{queueByProvider.gmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm">Outlook</span>
                </div>
                <span className="text-lg font-bold">{queueByProvider.outlook}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Other</span>
                </div>
                <span className="text-lg font-bold">{queueByProvider.other}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IP Reputation & Domain Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IP Reputation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                IP Reputation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total IPs</span>
                  <span className="text-lg font-bold">{ipReputation.totalIPs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Clean
                  </span>
                  <span className="text-lg font-bold text-green-500">{ipReputation.cleanIPs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Blacklisted
                  </span>
                  <span className="text-lg font-bold text-red-500">{ipReputation.blacklistedIPs}</span>
                </div>
              </div>

              <Collapsible open={blacklistBreakdownOpen} onOpenChange={setBlacklistBreakdownOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      View Blacklist Breakdown (10 RBLs)
                    </span>
                    {blacklistBreakdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  {rblBreakdown.map((rbl) => (
                    <div key={rbl.name} className="flex justify-between items-center py-1">
                      <span className="text-sm text-muted-foreground">{rbl.name}</span>
                      <span className={`text-sm font-bold ${rbl.count > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {rbl.count}
                      </span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={blacklistedIPsOpen} onOpenChange={setBlacklistedIPsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="destructive" className="w-full justify-between">
                    <span>View All Blacklisted IPs ({ipReputation.blacklistedIPs})</span>
                    {blacklistedIPsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  {blacklistedIPs.map((ip) => (
                    <div key={ip.ip} className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
                      <div className="font-mono text-sm font-bold">{ip.ip}</div>
                      <div className="text-xs text-muted-foreground mt-1">{ip.blacklists}</div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="text-xs text-muted-foreground">
                Last checked: 2025-10-18 19:40:58
              </div>
            </CardContent>
          </Card>

          {/* Domain Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Domain Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Domains</span>
                  <span className="text-lg font-bold">{domainHealth.totalDomains}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Healthy
                  </span>
                  <span className="text-lg font-bold text-green-500">
                    {domainHealth.healthyDomains} ({domainHealth.healthPercentage}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    Warning
                  </span>
                  <span className="text-lg font-bold text-yellow-500">{domainHealth.warningDomains}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Critical
                  </span>
                  <span className="text-lg font-bold text-red-500">{domainHealth.criticalDomains}</span>
                </div>
              </div>

              <Collapsible open={warningDomainsOpen} onOpenChange={setWarningDomainsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between border-yellow-500/50">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      View Warning Domains ({domainHealth.warningDomains})
                    </span>
                    {warningDomainsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  {warningDomains.map((domain) => (
                    <div key={domain.domain} className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-3">
                      <div className="font-medium text-sm">{domain.domain}</div>
                      <div className="text-xs text-muted-foreground mt-1">Missing: {domain.missingRecords}</div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={criticalDomainsOpen} onOpenChange={setCriticalDomainsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="destructive" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      View Critical Domains ({domainHealth.criticalDomains})
                    </span>
                    {criticalDomainsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {criticalDomains.map((domain) => (
                    <div key={domain.domain} className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
                      <div className="font-medium text-sm">{domain.domain}</div>
                      <div className="text-xs text-muted-foreground mt-1">Missing: {domain.missingRecords}</div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="text-xs text-muted-foreground">
                Last checked: 2025-10-18 22:01:08
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Provider Performance (Today's Deliveries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {providerPerformance.map((provider) => (
                <div key={provider.provider} className="border rounded-lg p-4 space-y-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      provider.provider.includes('Yahoo') ? 'bg-yellow-500' :
                      provider.provider.includes('Gmail') ? 'bg-blue-500' :
                      provider.provider.includes('Outlook') ? 'bg-cyan-500' : 'bg-green-500'
                    }`}></div>
                    {provider.provider}
                  </div>
                  <div className="text-2xl font-bold">{provider.successRate}%</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Sent: {provider.sent.toLocaleString()}</div>
                    <div>Deferred: {provider.deferred.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Provider stats show deliveries TO that provider only. Total sent (112,932) includes all providers. "Deferred" = temporarily delayed, will retry (not bounced).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Server Health & Bounce Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Server Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CPU Usage</span>
                <span className="text-lg font-bold">{serverHealth.cpuUsage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">RAM Usage</span>
                <span className="text-lg font-bold">{serverHealth.ramUsage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Disk Usage</span>
                <span className="text-lg font-bold">{serverHealth.diskUsage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Exim Status</span>
                <Badge className="bg-green-500/20 text-green-500">{serverHealth.eximStatus}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium">{serverHealth.uptime}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bounce Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Bounce Statistics (Today)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hard Bounces</span>
                <span className="text-lg font-bold text-red-500">{bounceStats.hardBounces}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Soft Bounces</span>
                <span className="text-lg font-bold text-yellow-500">{bounceStats.softBounces}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Bounces</span>
                <span className="text-lg font-bold">{bounceStats.totalBounces}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bounce Rate</span>
                <span className="text-lg font-bold">{bounceStats.bounceRate}%</span>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Thresholds:</strong> &lt; 2% = <span className="text-green-500">GREEN</span> | 2-5% = <span className="text-yellow-500">YELLOW</span> | &gt; 5% = <span className="text-red-500">RED</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Download Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-yellow-500/50 bg-yellow-500/5 rounded-lg p-6 text-center space-y-3">
                <div className="text-4xl">🟡</div>
                <div>
                  <div className="font-bold text-lg">Warning Domains</div>
                  <div className="text-sm text-muted-foreground">Missing 1 DNS record</div>
                </div>
                <Button 
                  onClick={() => downloadCSV('Warning Domains')} 
                  variant="outline"
                  className="w-full border-yellow-500/50 hover:bg-yellow-500/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>

              <div className="border-2 border-red-500/50 bg-red-500/5 rounded-lg p-6 text-center space-y-3">
                <div className="text-4xl">🔴</div>
                <div>
                  <div className="font-bold text-lg">Critical Domains</div>
                  <div className="text-sm text-muted-foreground">Missing 2+ DNS records</div>
                </div>
                <Button 
                  onClick={() => downloadCSV('Critical Domains')} 
                  variant="outline"
                  className="w-full border-red-500/50 hover:bg-red-500/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>

              <div className="border-2 border-red-500/50 bg-red-500/5 rounded-lg p-6 text-center space-y-3">
                <div className="text-4xl">🛡️</div>
                <div>
                  <div className="font-bold text-lg">Blacklisted IPs</div>
                  <div className="text-sm text-muted-foreground">IPs on RBL lists</div>
                </div>
                <Button 
                  onClick={() => downloadCSV('Blacklisted IPs')} 
                  variant="outline"
                  className="w-full border-red-500/50 hover:bg-red-500/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

// Helper components
import { CheckCircle, XCircle } from "lucide-react";

export default AdminServerMonitoring;