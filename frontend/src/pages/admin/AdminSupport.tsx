import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  MessageSquare,
  User,
  Clock,
  TrendingUp,
  Calendar,
  Bell,
  Send,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  useAssignTicketMutation
} from "@/services/ticketService";
import { useAllUsersQuery } from "../../services/adminUserService";
import { useSelector } from "react-redux";
import Pagination from "../../components/Pagination";
import SearchableSelect from "./SearchableSelect";
import {useGetAdminListQuery } from "@/services/adminUserService";
const API_URL = import.meta.env.VITE_API_URL;

const AdminSupport = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState("open");
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState(null);

  const { user, token, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );

  const isAdmin = user?.role_id == 1;

  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketNotes, setTicketNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [file, setFile] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const [newRepliesCount, setNewRepliesCount] = useState(0);
  const [ticketStats, setTicketStats] = useState({
    last24h: 0,
    last7days: 0,
    last30days: 0,
  });
  const bottomRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const [newTicket, setNewTicket] = useState({
    user_id: "",
    subject: "",
    message: "",
    priority: "medium",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState({ status: "open", priority: "" });

  const { data } = useGetAllTicketsQuery({
    page,
    limit,
    status: filter.status,
    priority: filter.priority,
  });

  //console.log("data", data);

  const tickets = data?.data || [];

  const { data: users } = useAllUsersQuery();
  //console.log("Users:", users?.users);

   const { data: admins} = useGetAdminListQuery();
    const adminUsers = admins?.data || [];
    console.log("admin",admins?.data);

  const [createTicket] = useCreateTicketMutation();

  const handleCreateTicket = async () => {
    if (!newTicket.user_id || !newTicket.subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("subject", newTicket.subject);
      formData.append("message", newTicket.message);
      formData.append("priority", newTicket.priority);

      // Append user_id if admin creating for someone
      if (isAdmin && newTicket.user_id) {
        formData.append("user_id", newTicket.user_id);
      }

      // Append file if available
      if (file) formData.append("file", file);

      // all the backend API
      await createTicket(formData).unwrap();

      toast.success("Ticket created successfully");
      setCreateDialogOpen(false);
      setNewTicket({
        user_id: "",
        subject: "",
        message: "",
        priority: "medium",
      });
      setFile(null);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(error?.data?.message || "Error creating ticket");
    }
  };

  //Import the lazy query
  const [getNotesByTicketId] = useLazyGetAllNotesByTicketIdQuery();

  const [addTicketNote] = useAddTicketNoteMutation();

  const handleAddNote = async () => {
    //console.log(selectedTicket.id, newNote);
    if (!newNote.trim() || !selectedTicket) return;
    try {
      const newticketId = selectedTicket.id;
      await addTicketNote({ ticketId: newticketId, note: newNote }).unwrap();
      toast.success("Note added successfully!");
      // Refresh the notes list after adding
      const { data: updatedNotes } = await getNotesByTicketId(newticketId);
      setTicketNotes(updatedNotes?.notes || []);
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const [getRepliesByTicketId] = useLazyGetRepliesQuery();

  const [getTicketDetail, { data: ticketDetail }] =
    useLazyGetTicketDetailByIdQuery();
  const handleViewTicket = async (ticket: any) => {
    try {
      const result = await getTicketDetail(ticket.id).unwrap();
      const t = result?.data;
      console.log("Ticket Detail:", t.status);
      setTicket(t);
      setStatus(t.status);

      const { data: notes } = await getNotesByTicketId(ticket.id);
      // Update local state
      setTicketNotes(notes?.notes || []);
      //console.log("Viewing notes:", notes?.notes);
      const replies = await getRepliesByTicketId(ticket.id).unwrap();
      //console.log("Replies:", replies);
      setReplies(replies || []);
      // Set ticket and open modal
      setSelectedTicket(ticket);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };


  
  const [assignTicket, { isLoading }] = useAssignTicketMutation();

  const handleAssignTicket = async (
    ticketId: string,
    adminId: string | null
  ) => {

    const assignData ={
       ticket_id:ticketId, 
       assigned_to: adminId
    }
  
    const res = await assignTicket(assignData).unwrap();
    console.log("res", res);
    // const { error } = await supabase
    //   .from("support_tickets")
    //   .update({ assigned_to: adminId })
    //   .eq("id", ticketId);

    if (error) {
      toast.error("Error assigning ticket");
    } else {
      toast.success("Ticket assigned");
      //fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, assigned_to: adminId });
      }
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "resolved" || newStatus === "closed") {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId);

    if (error) {
      toast.error("Error updating ticket status");
    } else {
      toast.success("Ticket status updated");
      //fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, ...updates });
      }
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;

    const { error } = await supabase
      .from("support_tickets")
      .delete()
      .eq("id", ticketId);

    if (error) {
      toast.error("Error deleting ticket");
    } else {
      toast.success("Ticket deleted successfully");
      //fetchTickets();
    }
  };

  const [deleteNote] = useDeleteNoteMutation();

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(noteId).unwrap();
      toast.success("Note deleted successfully!");
      // Refresh the notes list after deleting
      const { data: updatedNotes } = await getNotesByTicketId(ticketId);
      setTicketNotes(updatedNotes?.notes || []);
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const [closeTicket] = useCloseTicketMutation();

  const handleCloseTicket = async () => {
    if (window.confirm("Are you sure you want to close this ticket?")) {
      try {
        console.log("ticket", ticket.id);
        await closeTicket(ticket.id).unwrap();
        setStatus("closed");
        toast.info("Ticket closed successfully");
      } catch {
        toast.error("Failed to close ticket");
      }
    }
  };

  const [replyTicket] = useReplyTicketMutation();

  const handleReply = async (e) => {
    error;
    e.preventDefault();
    const formData = new FormData();
    formData.append("ticket_id", ticket?.id);
    formData.append("message", message);
    if (file) formData.append("file", file);

    setSubmitting(true);
    try {
      await replyTicket(formData).unwrap();
      setMessage("");
      setFile(null);
      const replies = await getRepliesByTicketId(ticket.id).unwrap();
      //console.log("Replies:", replies);
      setReplies(replies || []);

      toast.success("Reply posted successfully");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const [rateTicket] = useRateTicketMutation();

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      await rateTicket({ id: ticket.id, rating, feedback }).unwrap();
      toast.success("Thanks for your feedback!");
      setTicket({ ...ticket, rating });
    } catch {
      toast.error("Could not submit rating");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Support Tickets
            </h1>
            <p className="text-muted-foreground">Manage all support requests</p>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-4">
              {(newTicketsCount > 0 || newRepliesCount > 0) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Bell className="h-6 w-6 text-primary" />
                      {newTicketsCount + newRepliesCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {newTicketsCount + newRepliesCount}
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {newTicketsCount} new ticket
                      {newTicketsCount !== 1 ? "s" : ""}
                    </p>
                    <p>
                      {newRepliesCount} new repl
                      {newRepliesCount !== 1 ? "ies" : "y"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      setNewTicketsCount(0);
                      setNewRepliesCount(0);
                      fetchTickets();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Clear Notifications
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark all notifications as read</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Ticket Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last 24 Hours
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">
                  {ticketStats.last24h}
                </p>
                <p className="text-sm text-muted-foreground">tickets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last 7 Days
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">
                  {ticketStats.last7days}
                </p>
                <p className="text-sm text-muted-foreground">tickets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last 30 Days
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">
                  {ticketStats.last30days}
                </p>
                <p className="text-sm text-muted-foreground">tickets</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Support Tickets</CardTitle>
                <CardDescription>
                  View and respond to user support requests
                </CardDescription>
              </div>
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </DialogTrigger>
                <div>
                  {/* <select
                    className="form-control"
                    value={filter.status}
                    onChange={(e) => {
                      setPage(1); // reset page when filter changes
                      setFilter({ ...filter, status: e.target.value });
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select> */}
                  <Select
                    value={filter.status}
                    onValueChange={(v) => {
                      setPage(1); // reset page when filter changes
                      setFilter({ ...filter, status: v });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="open">🟢 Open</SelectItem>
                      <SelectItem value="closed">🔴 Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  {/* <select
                    className="form-control"
                    value={filter.priority}
                    onChange={(e) => {
                      setPage(1); // reset page when filter changes
                      setFilter({ ...filter, priority: e.target.value });
                    }}
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select> */}
                  <Select
                    value={filter.priority}
                    onValueChange={(v) => {
                      setPage(1); // reset page when filter changes
                      setFilter({ ...filter, priority: v });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>
                      Create a ticket on behalf of a user
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>User</Label>
                      <SearchableSelect
                        users={users}
                        value={newTicket.user_id}
                        onChange={(v) =>
                          setNewTicket({ ...newTicket, user_id: v })
                        }
                      />

                      {/* <Select
                        value={newTicket.user_id}
                        onValueChange={(v) =>
                          setNewTicket({ ...newTicket, user_id: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.users?.map((user) => (
                            <SelectItem key={user?.id} value={user?.id}>
                              {user.fname + "  " + user.lname || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={newTicket.subject}
                        onChange={(e) =>
                          setNewTicket({
                            ...newTicket,
                            subject: e.target.value,
                          })
                        }
                        placeholder="Brief description of the issue"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newTicket.message}
                        onChange={(e) =>
                          setNewTicket({
                            ...newTicket,
                            message: e.target.value,
                          })
                        }
                        placeholder="Detailed description..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(v) =>
                          setNewTicket({ ...newTicket, priority: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <input
                        type="file"
                        className="form-control mb-2"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                    </div>
                    <Button onClick={handleCreateTicket} className="w-full">
                      Create Ticket
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {/* {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) :  */}
            {tickets?.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                No support tickets found
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets?.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          TICK-{ticket.id}
                        </TableCell>
                        <TableCell>
                          {ticket.user.name || ticket.profiles?.email || "—"}
                        </TableCell>
                        <TableCell
                          className="max-w-md truncate"
                          onClick={() => {
                            handleViewTicket(ticket);
                            setTicketId(ticket.id);
                          }}
                        >
                          {ticket.subject}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ticket.priority === "high"
                                ? "destructive"
                                : ticket.priority === "medium"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.status}
                            onValueChange={(value) =>
                              handleStatusChange(ticket.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.assigned_to || "unassigned"}
                            onValueChange={(value) =>
                              handleAssignTicket(
                                ticket.id,
                                value === "unassigned" ? null : value
                              )
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                Unassigned
                              </SelectItem>
                              {adminUsers?.filter((u) => u.id)
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name || user.email}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  total={data?.pagination?.total}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    TICK - {selectedTicket?.id}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTicket?.user?.name || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedTicket?.priority === "high"
                        ? "destructive"
                        : selectedTicket?.priority === "medium"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {selectedTicket?.priority}
                  </Badge>
                  <Badge variant="outline">{selectedTicket?.status}</Badge>
                </div>
              </div>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-6">
                {/* Ticket Info */}
                {/* <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedTicket.user?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge
                      variant={
                        selectedTicket.priority === "high"
                          ? "destructive"
                          : selectedTicket.priority === "medium"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">{selectedTicket.status}</Badge>
                  </div>
                </div> */}

                {/* Subject & Description */}
                {/* <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Subject
                    </Label>
                    <p className="font-medium">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Description
                    </Label>
                    <p className="text-sm whitespace-pre-wrap p-3 bg-muted/20 rounded-lg">
                      {selectedTicket.message || "No description provided"}
                    </p>
                  </div>
                </div> */}

                {/* conversation section */}

                <div className="row">
                  {/* Ticket Conversation */}
                  <div className="col-md-12">
                    <div
                      className="col-md-12 mx-auto p-4 bg-white"
                      style={{
                        border: "1px solid #f2efefff",
                        boxShadow: "0 0px 3px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-between mb-3 p-3"
                        style={{
                          backgroundColor: "#fafafa",
                          borderRadius: "8px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h3 className="text-center mb-0">
                          Ticket Conversation
                        </h3>
                        {status == "open" && (
                          <Button
                            onClick={handleCloseTicket}
                            className="btn btn-sm btn-danger"
                            style={{ height: "fit-content" }}
                          >
                            ✕
                          </Button>
                        )}
                      </div>

                      {error && (
                        <div className="alert alert-danger px-2 py-1 text-center">
                          {error}
                        </div>
                      )}

                      <div className="px-3 pt-4">
                        <div className="mb-4">
                          {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3 mb-3">
                              <div
                                className="rounded-circle text-white d-flex justify-content-center align-items-center"
                                style={{
                                  width: 40,
                                  height: 40,
                                  fontWeight: "bold",
                                  backgroundColor: "#e236a91a",
                                  borderRadius: "50%",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  display: "flex",
                                  borderColor:"#e236a91a",
                                  color:"#e236a9",
                                }}
                              >
                                {getInitials(reply.user.name)}
                              </div>
                              <div
                                // className={`ms-2 me-2 p-3 rounded shadow-sm ${
                                //   reply.name === "Admin"
                                //     ? "bg-light border"
                                //     : "bg-white border"
                                // }`}
                                style={{ maxWidth: "85%", width:"100%" }}
                              >
                                <div className="mb-1">
                                  <strong>{reply.user.name}</strong>{" "}
                                  <small
                                    className="text-muted"
                                    style={{ fontSize: "0.8em", color: "#666" }}
                                  >
                                    {new Date(
                                      reply.created_at
                                    ).toLocaleString()}
                                  </small>
                                </div>
                               
                                 <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                            </div>

                                {reply.file && (
                                  <a
                                    href={`${API_URL}files/${reply.file}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    📎 {reply.file}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={bottomRef}></div>
                        </div>

                        {status === "open" ? (
                          <form
                            onSubmit={handleReply}
                            encType="multipart/form-data"
                            className="d-flex flex-column"
                          >
                            <Textarea
                              placeholder="Type your reply..."
                              className="form-control mb-3"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              required
                            />
                            <Input
                              type="file"
                              className="form-control mb-2"
                              onChange={(e) => setFile(e.target.files[0])}
                            />
                            <Button
                              className="btn text-white border-0 mt-4 mx-auto"
                              style={{
                                backgroundColor: "#d946ef",
                                borderColor: "#d946ef",
                              }}
                              disabled={submitting}
                            >
                              {submitting ? (
                                <div
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                />
                              ) : (
                                // <Send className="h-4 w-4" />
                                "Send Reply"
                              )}
                            </Button>
                          </form>
                        ) : (
                          <div className="alert alert-secondary">
                            This ticket is closed. No further replies allowed.
                          </div>
                        )}

                        {status === "closed" && ticket?.rating == null && (
                          <div className="mt-4">
                            <h5>Rate your experience</h5>
                            <form onSubmit={handleRatingSubmit}>
                              <Select
                                value={rating}
                                onValueChange={(v) => setRating(v)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Select rating" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">
                                    ⭐⭐⭐⭐⭐ Excellent
                                  </SelectItem>
                                  <SelectItem value="4">
                                    ⭐⭐⭐⭐ Good
                                  </SelectItem>
                                  <SelectItem value="3">⭐⭐⭐ Okay</SelectItem>
                                  <SelectItem value="2">⭐⭐ Poor</SelectItem>
                                  <SelectItem value="1">⭐ Terrible</SelectItem>
                                </SelectContent>
                              </Select>
                              {/* <select
                                className="form-select mb-2"
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                                required
                              >
                                <option value="">Select rating</option>
                                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                                <option value="4">⭐⭐⭐⭐ Good</option>
                                <option value="3">⭐⭐⭐ Okay</option>
                                <option value="2">⭐⭐ Poor</option>
                                <option value="1">⭐ Terrible</option>
                              </select> */}
                              <Textarea
                                className="form-control mb-2"
                                placeholder="Additional feedback (optional)"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                              />
                              <Button className="btn btn-success">
                                Submit Rating
                              </Button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {/* <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">
                      Internal Notes
                    </Label>
                    <Badge variant="secondary">
                      {ticketNotes.length} notes
                    </Badge>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {ticketNotes?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No notes yet
                      </p>
                    ) : (
                      ticketNotes?.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-muted/20 rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                           
                            <p className="text-xs text-muted-foreground">
                              {new Date(note.created_at).toLocaleString()}
                            </p>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="btn btn-sm btn-danger"
                              title="Delete Note"
                              style={{ height: "fit-content" }}
                            >
                              🗑️
                            </button>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {note.note}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Add Note</Label>
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal note..."
                      rows={3}
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div> */}
              </div>
            )}



          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
