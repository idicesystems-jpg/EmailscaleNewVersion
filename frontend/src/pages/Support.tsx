import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { HelpCircle, MessageCircle, Ticket, Video, Send } from "lucide-react";
import { useState } from "react";

const Support = () => {
  const [showTicketPrompt, setShowTicketPrompt] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [showVideosDialog, setShowVideosDialog] = useState(false);
  
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleTicketClick = () => {
    setShowTicketPrompt(true);
  };

  const handleProceedToTicket = () => {
    setShowTicketPrompt(false);
    setShowTicketForm(true);
  };

  const handleSubmitTicket = () => {
    console.log('Ticket submitted:', { subject: ticketSubject, message: ticketMessage });
    setTicketSubject('');
    setTicketMessage('');
    setShowTicketForm(false);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages([...chatMessages, { role: 'user', content: chatMessage }]);
    setChatMessage('');
  };

  const faqs = [
    {
      question: "How do I set up email warmup?",
      answer: "Navigate to the Email Warmup section and follow the step-by-step guide to configure your warmup settings."
    },
    {
      question: "What is domain forwarding?",
      answer: "Domain forwarding redirects your domain to another website. Note: This can negatively impact email deliverability."
    },
    {
      question: "How many emails should I have per domain?",
      answer: "We recommend 3 emails per domain for optimal deliverability and warmup performance."
    },
    {
      question: "How do I connect my integrations?",
      answer: "Go to the Integrations page and select the platform you want to connect (Highlevel, Instantly, or Smartlead)."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards and offer various subscription plans to fit your needs."
    }
  ];

  const videos = [
    { title: "Getting Started with EmailScale", url: "#", duration: "5:23" },
    { title: "Setting Up Your First Campaign", url: "#", duration: "8:15" },
    { title: "Email Warmup Best Practices", url: "#", duration: "6:45" },
    { title: "Understanding Deliverability", url: "#", duration: "10:30" },
    { title: "Integration Setup Guide", url: "#", duration: "7:12" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Support</h1>
          <p className="text-muted-foreground">Get help and support for EmailScale</p>
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
              <CardDescription>Submit a support ticket to our team</CardDescription>
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
              <CardDescription>Get instant answers from our AI assistant</CardDescription>
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
              <AlertDialogTitle>Have you checked our resources?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Before creating a support ticket, we recommend checking our:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Video Library - Step-by-step tutorials</li>
                  <li>FAQ Section - Common questions and answers</li>
                </ul>
                <p className="mt-4">You might find a quick answer to your question there!</p>
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
            <div className="space-y-4">
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
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border'
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
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
                      <p className="font-medium text-foreground">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{video.duration}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default Support;
