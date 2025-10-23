import { useEffect, useState } from "react";
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
import { Trash2, Plus, MessageSquare, User, Clock } from "lucide-react";
import {
  useCreateTicketMutation,
  useGetAllTicketsQuery,
  useGetTicketDetailByIdQuery,
  useReplyTicketMutation,
  useGetRepliesQuery,
  useGetUserTicketsQuery,
  useCloseTicketMutation,
  useLazyGetAllNotesByTicketIdQuery,
  useAddTicketNoteMutation,
  useDeleteNoteMutation,
} from "@/services/ticketService";
import { useAllUsersQuery } from "../../services/adminUserService";
import { useSelector } from "react-redux";

const AdminSupport = () => {
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
  const [newTicket, setNewTicket] = useState({
    user_id: "",
    subject: "",
    message: "",
    priority: "medium",
  });

  const { data, isLoading } = useGetAllTicketsQuery();
  const tickets = data?.data || [];

  const { data: users } = useAllUsersQuery();
  //console.log("Users:", users?.users);

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

  const handleViewTicket = async (ticket: any) => {
    try {
      // Fetch notes dynamically
      const { data: notes } = await getNotesByTicketId(ticket.id);
      ``;
      // Update local state
      setTicketNotes(notes?.notes || []);
      console.log("Viewing notes:", notes?.notes);

      // Set ticket and open modal
      setSelectedTicket(ticket);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const handleAssignTicket = async (
    ticketId: string,
    adminId: string | null
  ) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ assigned_to: adminId })
      .eq("id", ticketId);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Support Tickets
          </h1>
          <p className="text-muted-foreground">Manage all support requests</p>
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
                      <Select
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
                      </Select>
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
                      <TableCell className="font-medium">{ticket.id}</TableCell>
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
                            {users?.users
                              .filter((u) => u.id)
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name || user.email}
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
            )}
          </CardContent>
        </Card>

        {/* Ticket Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Ticket Details - {selectedTicket?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
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
                </div>

                {/* Subject & Description */}
                <div className="space-y-3">
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
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
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
                            {/* <p className="text-sm font-medium">
                              {note.admin?.full_name ||
                                note.admin?.email ||
                                "Admin"}
                            </p> */}
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

                  {/* Add Note */}
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
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
