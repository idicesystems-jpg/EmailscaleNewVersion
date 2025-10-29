import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Globe,
  Mail,
  Activity,
  Send,
  Target,
  Ticket,
  Clock,
  Server,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare,
  Trash2,
  UserPlus,
  Reply,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useImpersonation } from "@/hooks/useImpersonation";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateTicketMutation,
  useGetAllTicketsQuery,
  useLazyGetTicketDetailByIdQuery,
  useReplyTicketMutation,
  useLazyGetRepliesQuery,
  useGetUserTicketsQuery,
  useCloseTicketMutation,
  useLazyGetAllNotesByTicketIdQuery,
  useAddTicketNoteMutation,
  useDeleteNoteMutation,
  useRateTicketMutation,
} from "@/services/ticketService";
import { useGetAdminListQuery } from "@/services/adminUserService";

import {
  useAddAdminNoteMutation,
  useGetAdminNotesQuery,
  useAddAdminNoteReplyMutation,
  useDeleteNoteWithRepliesMutation,
} from "@/services/adminNoteService";

import { useSelector } from "react-redux";

const AdminDashboard = () => {
  const { impersonatedUserId } = useImpersonation();
  const { user, token, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );

  const isAdmin = user?.role_id == 0;

  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDomains: 0,
    totalInboxes: 0,
    avgHealthScore: 0,
    totalEmailSends: 0,
    inboxPlacement: 0,
  });

  const [users, setUsers] = useState<any[]>([]);
  //const [tickets, setTickets] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<
    "healthy" | "warning" | "critical"
  >("healthy");
  const [expandedLogs, setExpandedLogs] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  //const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  //const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  const { data: notes } = useGetAdminNotesQuery();
  console.log("notes", notes?.data);
  const adminNotes = notes?.data || [];

  const { data } = useGetAllTicketsQuery({
    page: 1,
    limit: 100,
    status: "open",
  });

  const tickets = data?.data || [];

  const { data: admins } = useGetAdminListQuery();
  const adminUsers = admins?.data || [];
  console.log("admin", admins?.data);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchTickets();
    fetchServerStatus();
    fetchActivityLogs();
    fetchAllUsers();
    fetchAdminNotes();
    fetchAdminUsers();
  }, [impersonatedUserId]);

  const fetchStats = async () => {
    // Build queries with optional user filter
    let domainsQuery = supabase
      .from("domains")
      .select("*", { count: "exact", head: true });
    let inboxesQuery = supabase
      .from("inboxes")
      .select("*", { count: "exact", head: true });
    let inboxesDataQuery = supabase.from("inboxes").select("health_score");
    let sendsQuery = supabase
      .from("email_sends")
      .select("*", { count: "exact", head: true });
    let sendsDataQuery = supabase.from("email_sends").select("placement");

    if (impersonatedUserId) {
      domainsQuery = domainsQuery.eq("user_id", impersonatedUserId);
      inboxesQuery = inboxesQuery.eq("user_id", impersonatedUserId);
      inboxesDataQuery = inboxesDataQuery.eq("user_id", impersonatedUserId);
      sendsQuery = sendsQuery.eq("user_id", impersonatedUserId);
      sendsDataQuery = sendsDataQuery.eq("user_id", impersonatedUserId);
    }

    const [
      { count: usersCount },
      { count: domainsCount },
      { count: inboxesCount },
      { data: inboxesData },
      { count: sendsCount },
      { data: sendsData },
    ] = await Promise.all([
      impersonatedUserId
        ? supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("id", impersonatedUserId)
        : supabase.from("profiles").select("*", { count: "exact", head: true }),
      domainsQuery,
      inboxesQuery,
      inboxesDataQuery,
      sendsQuery,
      sendsDataQuery,
    ]);

    const avgHealth =
      inboxesData?.reduce(
        (acc, curr) => acc + (Number(curr.health_score) || 0),
        0
      ) / (inboxesData?.length || 1);
    const inboxCount =
      sendsData?.filter((s) => s.placement === "inbox").length || 0;
    const placementRate = (inboxCount / (sendsData?.length || 1)) * 100;

    setStats({
      totalUsers: usersCount || 0,
      totalDomains: domainsCount || 0,
      totalInboxes: inboxesCount || 0,
      avgHealthScore: Math.round(avgHealth || 0),
      totalEmailSends: sendsCount || 0,
      inboxPlacement: Math.round(placementRate || 0),
    });
  };

  const fetchUsers = async () => {
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, last_login, last_active_at, created_at");

    if (impersonatedUserId) {
      query = query.eq("id", impersonatedUserId);
    } else {
      query = query.order("last_login", {
        ascending: false,
        nullsFirst: false,
      });
    }

    const { data } = await query;
    setUsers(data || []);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("email", { ascending: true });

    setAllUsers(data || []);
  };

  const fetchTickets = async () => {
    let query = supabase.from("support_tickets").select(`
        *,
        profiles:user_id (full_name, email)
      `);

    if (impersonatedUserId) {
      query = query.eq("user_id", impersonatedUserId);
    }

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(5);

    //setTickets(data || []);
  };

  const fetchActivityLogs = async () => {
    console.log("Fetching activity logs...");
    let query = supabase
      .from("user_activity_logs")
      .select("*")
      .eq("activity_type", "sign_in")
      .order("created_at", { ascending: false });

    if (impersonatedUserId) {
      query = query.eq("user_id", impersonatedUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching activity logs:", error);
      setActivityLogs([]);
      return;
    }

    // Fetch user details for each unique user_id
    const userIds = [...new Set((data || []).map((log) => log.user_id))];
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    // Map user details to activity logs
    const logsWithUsers = (data || []).map((log) => ({
      ...log,
      profiles: usersData?.find((user) => user.id === log.user_id) || null,
    }));

    console.log("Activity logs fetched:", {
      count: logsWithUsers.length,
      logsWithUsers,
    });
    setActivityLogs(logsWithUsers);
  };

  const fetchServerStatus = async () => {
    // Check recent blacklist checks (last 7 days)
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [
      { data: blacklistData },
      { data: complaintData },
      { data: monitoredIPs },
    ] = await Promise.all([
      supabase
        .from("ip_blacklist_checks")
        .select("*")
        .gte("checked_at", sevenDaysAgo),
      supabase.from("spam_complaints").select("*").eq("resolved", false),
      supabase.from("monitored_ips").select("*").eq("status", "active"),
    ]);

    // Calculate critical issues
    const blacklistedIPs =
      blacklistData?.filter((check) => check.is_blacklisted).length || 0;
    const unresolvedComplaints = complaintData?.length || 0;
    const activeIPs = monitoredIPs?.length || 0;

    // Determine status
    if (blacklistedIPs >= 3 || unresolvedComplaints >= 5) {
      setServerStatus("critical");
    } else if (
      blacklistedIPs > 0 ||
      unresolvedComplaints > 0 ||
      activeIPs === 0
    ) {
      setServerStatus("warning");
    } else {
      setServerStatus("healthy");
    }
  };

  const filteredLogs = activityLogs.filter((log) => {
    // Filter by selected user
    if (selectedUserId !== "all" && log.user_id !== selectedUserId) {
      return false;
    }

    // Filter by search text
    if (!logSearch) return true;
    const searchLower = logSearch.toLowerCase();
    const email = log.profiles?.email?.toLowerCase() || "";
    const name = log.profiles?.full_name?.toLowerCase() || "";
    const timestamp = new Date(log.created_at).toLocaleString().toLowerCase();
    return (
      email.includes(searchLower) ||
      name.includes(searchLower) ||
      timestamp.includes(searchLower)
    );
  });

  console.log("Activity logs state:", {
    total: activityLogs.length,
    filtered: filteredLogs.length,
    selectedUserId,
    logSearch,
  });

  const fetchAdminUsers = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(
        `
        user_id,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `
      )
      .in("role", ["admin", "super_admin"]);

    if (error) {
      console.error("Error fetching admin users:", error);
      setAdminUsers([]);
      return;
    }

    // Extract profiles and filter out any null/undefined values
    const admins = (data || [])
      .map((item) => item.profiles)
      .filter(
        (profile): profile is NonNullable<typeof profile> =>
          profile !== null && profile !== undefined
      );

    console.log("Admin users fetched:", admins);
    setAdminUsers(admins);
  };

  const fetchAdminNotes = async () => {
    const { data, error } = await supabase
      .from("admin_notes")
      .select(
        `
        *,
        created_by_profile:profiles!created_by (
          id,
          full_name,
          email
        ),
        assigned_profile:profiles!assigned_to (
          id,
          full_name,
          email
        )
      `
      )
      .is("parent_note_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin notes:", error);
      return;
    }

    // Fetch replies for each note
    const notesWithReplies = await Promise.all(
      (data || []).map(async (note) => {
        const { data: replies } = await supabase
          .from("admin_notes")
          .select(
            `
          *,
          created_by_profile:profiles!created_by (
            id,
            full_name,
            email
          )
        `
          )
          .eq("parent_note_id", note.id)
          .order("created_at", { ascending: true });

        return {
          ...note,
          replies: replies || [],
        };
      })
    );

    //setAdminNotes(notesWithReplies);
  };

  const [addAdminNote, { isLoading, isSuccess, isError }] =
    useAddAdminNoteMutation();
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive",
      });
      return;
    }

    //const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add notes",
        variant: "destructive",
      });
      return;
    }

    const res = await addAdminNote({
      note: newNote.trim(),
      created_by: user.id,
      assigned_to: assignedTo === "unassigned" ? null : assignedTo || null,
    }).unwrap();

    console.log("add note responce", res);

    // const { error } = await supabase
    //   .from('admin_notes')
    //   .insert({
    //     note: newNote.trim(),
    //     created_by: user.id,
    //     assigned_to: assignedTo === "unassigned" ? null : assignedTo || null
    //   });

    // if (error) {
    //   console.error('Error adding note:', error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to add note",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    toast({
      title: "Success",
      description: "Note added successfully",
    });

    setNewNote("");
    setAssignedTo("");
    //fetchAdminNotes();
  };

  const [addAdminNoteReply] = useAddAdminNoteReplyMutation();
  const handleReply = async (parentNoteId: string, assignId) => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      });
      return;
    }

    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to reply",
        variant: "destructive",
      });
      return;
    }

    const replyData = {
      note_id: parentNoteId,
      user_id: assignId,
      reply_text: replyText,
    };

    const res = await addAdminNoteReply(replyData);
    console.log("replay ticket", res);

    // const { error } = await supabase.from("admin_notes").insert({
    //   note: replyText.trim(),
    //   created_by: user.id,
    //   parent_note_id: parentNoteId,
    // });

    // if (error) {
    //   console.error("Error adding reply:", error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to add reply",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    toast({
      title: "Success",
      description: "Reply added successfully",
    });

    setReplyText("");
    setReplyingTo(null);
    //fetchAdminNotes();
  };

  const [deleteNoteWithReplies] = useDeleteNoteWithRepliesMutation();

  const handleDeleteNote = async (noteId: string) => {
    // const { error } = await supabase
    //   .from("admin_notes")
    //   .delete()
    //   .eq("id", noteId);

    // if (error) {
    //   console.error("Error deleting note:", error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to delete note",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNoteWithReplies(noteId);
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.log("Failed to delete note");
    }

    //fetchAdminNotes();
  };

  const handleAssignNote = async (noteId: string, userId: string) => {
    const { error } = await supabase
      .from("admin_notes")
      .update({ assigned_to: userId === "unassigned" ? null : userId })
      .eq("id", noteId);

    if (error) {
      console.error("Error assigning note:", error);
      toast({
        title: "Error",
        description: "Failed to assign note",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Note assignment updated",
    });

    fetchAdminNotes();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              System overview and statistics
            </p>
          </div>
          <Badge
            variant={serverStatus === "healthy" ? "default" : "destructive"}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${
              serverStatus === "healthy"
                ? "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500"
                : serverStatus === "warning"
                ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500"
                : "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500"
            }`}
          >
            <Server className="h-4 w-4" />
            <span className="font-semibold">
              {serverStatus === "healthy"
                ? "Server Healthy"
                : serverStatus === "warning"
                ? "Server Unstable"
                : "Server Issues"}
            </span>
            <div
              className={`h-2 w-2 rounded-full ${
                serverStatus === "healthy"
                  ? "bg-green-500 animate-pulse"
                  : serverStatus === "warning"
                  ? "bg-orange-500 animate-pulse"
                  : "bg-red-500 animate-pulse"
              }`}
            />
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalUsers}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Domains
              </CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalDomains}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Inboxes
              </CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalInboxes}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Health Score
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.avgHealthScore}%
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Email Sends
              </CardTitle>
              <Send className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalEmailSends.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inbox Placement
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.inboxPlacement}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Tickets */}
        <Card
          className="border-border cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/admin/support")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-foreground">
                  <Ticket className="h-5 w-5 mr-2 text-primary" />
                  Recent Support Tickets
                </CardTitle>
                <CardDescription>
                  Latest support requests from users - Click to view all
                </CardDescription>
              </div>
              {tickets.length > 0 && (
                <Badge variant="outline" className="text-primary">
                  {tickets.length} Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No support tickets yet
              </p>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-start p-4 bg-secondary/20 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/admin/support");
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          #TICK-{ticket.id} - {ticket.user?.name || "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            ticket.status === "open"
                              ? "bg-orange-500/20 text-orange-500"
                              : ticket.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-500"
                              : "bg-green-500/20 text-green-500"
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Admin Notes Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              Admin Notes
            </CardTitle>
            <CardDescription>
              Internal notes and actions - visible only to admins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add Note Form */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note or action item..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px] resize-none flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        handleAddNote();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {adminUsers.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.name || admin.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {adminNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notes yet. Add your first note above.
                  </div>
                ) : (
                  adminNotes.map((note) => (
                    <div
                      key={note.id}
                      className="border rounded-lg bg-card/50 hover:bg-card/70 transition-colors"
                    >
                      {/* Parent Note */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm text-foreground flex-1">
                            {note.note}
                          </p>
                          <div className="flex items-center gap-2">
                            <Select
                              value={note.assigned_to || "unassigned"}
                              onValueChange={(value) =>
                                handleAssignNote(note.id, value)
                              }
                            >
                              <SelectTrigger className="w-[140px] h-7 text-xs">
                                <div className="flex items-center gap-1">
                                  <UserPlus className="h-3 w-3" />
                                  <SelectValue placeholder="Assign..." />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">
                                  Unassigned
                                </SelectItem>
                                {adminUsers.map((admin) => (
                                  <SelectItem key={admin.id} value={admin.id}>
                                    {admin.name || admin.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(note.created_at).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <span>•</span>
                              <span className="font-medium">
                                By:{" "}
                                {note.creator?.name ||
                                  note.creator?.email ||
                                  "Unknown"}
                              </span>
                            </div>
                            {note.assignee && (
                              <div className="flex items-center gap-1">
                                <span>•</span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0"
                                >
                                  <UserPlus className="h-2 w-2 mr-1" />
                                  {note.assignee.name || note.assignee.email}
                                </Badge>
                              </div>
                            )}
                            {note.replies && note.replies.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span>•</span>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0"
                                >
                                  <MessageSquare className="h-2 w-2 mr-1" />
                                  {note.replies.length}{" "}
                                  {note.replies.length === 1
                                    ? "reply"
                                    : "replies"}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              setReplyingTo(
                                replyingTo === note.id ? null : note.id
                              )
                            }
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        </div>

                        {/* Reply Input */}
                        {replyingTo === note.id && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[60px] resize-none flex-1 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && e.ctrlKey) {
                                    handleReply(note.id, note.assigned_to);
                                  }
                                }}
                              />
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleReply(note.id, note.assigned_to)
                                  }
                                  disabled={!replyText.trim()}
                                >
                                  Send
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Replies */}
                      {note.replies && note.replies.length > 0 && (
                        <div className="border-t border-border bg-muted/30">
                          {note.replies.map((reply: any) => (
                            <div
                              key={reply.id}
                              className="p-4 pl-8 border-l-2 border-primary/20 ml-4 space-y-2"
                            >
                              <p className="text-sm text-foreground">
                                {reply.reply_text}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(reply.created_at).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>•</span>
                                  <span className="font-medium">
                                    {note.creator?.name ||
                                      reply.creator?.email ||
                                      "Unknown"}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 ml-auto hover:bg-destructive/20 hover:text-destructive"
                                  onClick={() => handleDeleteNote(reply.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent User Activity */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-foreground">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Recent User Activity
                </CardTitle>
                <CardDescription>Users by last login time</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedLogs(!expandedLogs)}
              >
                {expandedLogs ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Collapse Logs
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View Detailed Logs
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No user activity yet
              </p>
            ) : (
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => {
                  const lastLogin = user.last_login
                    ? new Date(user.last_login)
                    : null;
                  const lastActive = user.last_active_at
                    ? new Date(user.last_active_at)
                    : null;
                  const isRecentlyActive =
                    lastActive &&
                    Date.now() - lastActive.getTime() < 30 * 60 * 1000; // 30 minutes

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-secondary/20 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isRecentlyActive
                              ? "bg-green-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.full_name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {lastLogin ? (
                          <>
                            <p className="text-xs text-foreground">
                              Last login: {lastLogin.toLocaleDateString()}{" "}
                              {lastLogin.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {lastActive && (
                              <p className="text-xs text-muted-foreground">
                                Active: {lastActive.toLocaleDateString()}{" "}
                                {lastActive.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Never logged in
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expanded Logs Section */}
            {expandedLogs && (
              <div className="mt-6 border-t pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user, email, or date..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Badge variant="outline">
                    {filteredLogs.length}{" "}
                    {filteredLogs.length === 1 ? "Log" : "Logs"}
                  </Badge>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Browser/Platform</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.profiles?.full_name || "Unknown"}
                            </TableCell>
                            <TableCell>{log.profiles?.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {log.activity_type.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="space-y-1">
                                <div>{log.metadata?.browser || "Unknown"}</div>
                                <div className="text-[10px]">
                                  {log.metadata?.platform || "Unknown"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="space-y-1">
                                {log.metadata?.timezone && (
                                  <div>🌍 {log.metadata.timezone}</div>
                                )}
                                {log.metadata?.screen_resolution && (
                                  <div>📺 {log.metadata.screen_resolution}</div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
