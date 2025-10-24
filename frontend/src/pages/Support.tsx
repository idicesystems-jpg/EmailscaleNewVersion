import { DashboardLayout } from "@/components/DashboardLayout";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, MessageCircle, Ticket, Video, Send } from "lucide-react";
import { useState, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Trash2, Plus, MessageSquare, User, Clock } from "lucide-react";
import Pagination from "../components/Pagination";

const API_URL = import.meta.env.VITE_API_URL;

const Support = () => {
  const [showTicketPrompt, setShowTicketPrompt] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [showVideosDialog, setShowVideosDialog] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [ticketId, setTicketId] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("open");
  const [replies, setReplies] = useState([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const bottomRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");

  const [error, setError] = useState("");

  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [file, setFile] = useState(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState({ status: "open", priority: "" });

  const { data } = useGetUserTicketsQuery({
    page,
    limit,
    status: filter.status,
    priority: filter.priority,
  });
  const tickets = data || [];

  const { user, token, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );

  const isAdmin = user?.role_id == 1;
  const [newTicket, setNewTicket] = useState({
    user_id: "",
    subject: "",
    message: "",
    priority: "medium",
  });

  const handleTicketClick = () => {
    setShowTicketPrompt(true);
  };

  const handleProceedToTicket = () => {
    setShowTicketPrompt(false);
    setShowTicketForm(true);
  };

  const handleSubmitTicket = () => {
    console.log("Ticket submitted:", {
      subject: ticketSubject,
      message: ticketMessage,
    });
    setTicketSubject("");
    setTicketMessage("");
    setShowTicketForm(false);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages([...chatMessages, { role: "user", content: chatMessage }]);
    setChatMessage("");
  };

  const faqs = [
    {
      question: "How do I set up email warmup?",
      answer:
        "Navigate to the Email Warmup section and follow the step-by-step guide to configure your warmup settings.",
    },
    {
      question: "What is domain forwarding?",
      answer:
        "Domain forwarding redirects your domain to another website. Note: This can negatively impact email deliverability.",
    },
    {
      question: "How many emails should I have per domain?",
      answer:
        "We recommend 3 emails per domain for optimal deliverability and warmup performance.",
    },
    {
      question: "How do I connect my integrations?",
      answer:
        "Go to the Integrations page and select the platform you want to connect (Highlevel, Instantly, or Smartlead).",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards and offer various subscription plans to fit your needs.",
    },
  ];

  const videos = [
    { title: "Getting Started with EmailScale", url: "#", duration: "5:23" },
    { title: "Setting Up Your First Campaign", url: "#", duration: "8:15" },
    { title: "Email Warmup Best Practices", url: "#", duration: "6:45" },
    { title: "Understanding Deliverability", url: "#", duration: "10:30" },
    { title: "Integration Setup Guide", url: "#", duration: "7:12" },
  ];

  const [createTicket] = useCreateTicketMutation();

  const handleCreateTicket = async () => {
    if (!newTicket.subject) {
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

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Support</h1>
          <p className="text-muted-foreground">
            Get help and support for EmailScale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Support Ticket */}
          <Card
            className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={handleTicketClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Ticket className="h-5 w-5 mr-2 text-primary" />
                Support Ticket
              </CardTitle>
              <CardDescription>
                Submit a support ticket to our team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-primary to-primary-glow">
                Create Ticket
              </Button>
            </CardContent>
          </Card>

          {/* Live AI Chat */}
          <Card
            className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setShowChatDialog(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                Live AI Chat
              </CardTitle>
              <CardDescription>
                Get instant answers from our AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card
            className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setShowFaqDialog(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                FAQs
              </CardTitle>
              <CardDescription>Common questions and answers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View FAQs
              </Button>
            </CardContent>
          </Card>

          {/* Helpful Videos */}
          <Card
            className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setShowVideosDialog(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Video className="h-5 w-5 mr-2 text-primary" />
                Helpful Videos
              </CardTitle>
              <CardDescription>Learn with our video tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Watch Videos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Prompt Dialog */}
        <AlertDialog open={showTicketPrompt} onOpenChange={setShowTicketPrompt}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Have you checked our resources?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Before creating a support ticket, we recommend checking our:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Video Library - Step-by-step tutorials</li>
                  <li>FAQ Section - Common questions and answers</li>
                </ul>
                <p className="mt-4">
                  You might find a quick answer to your question there!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleProceedToTicket}>
                Continue to Create Ticket
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Ticket Form Dialog */}
        <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Submit a Support Ticket
              </DialogTitle>
              <DialogDescription>
                Our team will respond to your ticket within 24 hours
              </DialogDescription>
            </DialogHeader>
            {/* <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Subject</Label>
                <Input
                  id="ticket-subject"
                  placeholder="Brief description of your issue"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-message">Message</Label>
                <Textarea
                  id="ticket-message"
                  placeholder="Please describe your issue in detail..."
                  rows={8}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                />
              </div>
              <Button 
                className="w-full"
                onClick={handleSubmitTicket}
                disabled={!ticketSubject || !ticketMessage}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Ticket
              </Button>
            </div> */}
            <div className="space-y-4">
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

        {/* Live Chat Dialog */}
        <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Live AI Assistant
              </DialogTitle>
              <DialogDescription>
                Get instant answers to your questions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 h-[400px] overflow-y-auto space-y-4 bg-muted/20">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Start a conversation with our AI assistant</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* FAQs Dialog */}
        <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </DialogTitle>
              <DialogDescription>
                Find quick answers to common questions
              </DialogDescription>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DialogContent>
        </Dialog>

        {/* Videos Dialog */}
        <Dialog open={showVideosDialog} onOpenChange={setShowVideosDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Helpful Video Tutorials
              </DialogTitle>
              <DialogDescription>
                Learn how to use EmailScale with our video guides
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {videos.map((video, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {video.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {video.duration}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Watch
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Support Tickets</CardTitle>
                <CardDescription>
                  View and respond to user support requests
                </CardDescription>
              </div>
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
            </div>
          </CardHeader>
          <CardContent>
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
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets?.data?.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          {ticket.id}
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
                          <Select value={ticket.status}>
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
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  total={tickets?.pagination?.total}
                />
              </>
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
                            <div key={reply.id} className="d-flex mb-3">
                              <div
                                className="rounded-circle text-white d-flex justify-content-center align-items-center"
                                style={{
                                  width: 40,
                                  height: 40,
                                  fontWeight: "bold",
                                  backgroundColor: "#d946ef",
                                  borderRadius: "50%",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  display: "flex",
                                }}
                              >
                                {getInitials(reply.user.name)}
                              </div>
                              <div
                                className={`ms-2 me-2 p-3 rounded shadow-sm ${
                                  reply.name === "Admin"
                                    ? "bg-light border"
                                    : "bg-white border"
                                }`}
                                style={{ maxWidth: "85%" }}
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
                                <p className="mb-1">{reply.message}</p>

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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Support;
