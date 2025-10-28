import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Settings, HeadphonesIcon, Package, X, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OnboardingWalkthroughProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to EmailScale! 🎉",
    description: "Let's take a quick tour to help you get started with your email warmup and deliverability management.",
    icon: CheckCircle2,
  },
  {
    title: "Step 1: Connect Your Integrations",
    description: "First, connect your email service providers like HighLevel, Instantly, or SmartLeads. This syncs all your inboxes automatically so we can start warming them up.",
    icon: Package,
    action: "Go to Integrations",
    route: "/dashboard/integrations",
  },
  {
    title: "Step 2: Order Additional Inboxes",
    description: "Need more inboxes? You can order new ones directly from the Inbox Ordering page. We'll set them up and start warming them immediately.",
    icon: Mail,
    action: "View Inbox Ordering",
    route: "/dashboard/inbox-ordering",
  },
  {
    title: "Step 3: Update Your Settings",
    description: "Customize your warmup settings, notification preferences, and account details in the Settings page.",
    icon: Settings,
    action: "Go to Settings",
    route: "/dashboard/settings",
  },
  {
    title: "Need Help?",
    description: "If you have any questions or run into issues, our support team is here to help. Click Support in the sidebar anytime.",
    icon: HeadphonesIcon,
    action: "Contact Support",
    route: "/dashboard/support",
  },
];

export function OnboardingWalkthrough({ open, onComplete }: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-navigate to the current step's route
  useEffect(() => {
    if (open && currentStep > 0) {
      const step = steps[currentStep];
      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
      }
    }
  }, [currentStep, open, navigate, location.pathname]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!open) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
      <Card className={cn(
        "w-[380px] shadow-2xl border-2 border-primary/20",
        "backdrop-blur-sm bg-background/95"
      )}>
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg ring-2 ring-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight">{currentStepData.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <CardDescription className="text-sm leading-relaxed">
            {currentStepData.description}
          </CardDescription>

          {/* Progress bar */}
          <div className="flex gap-1 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  index <= currentStep ? "bg-primary" : "bg-secondary"
                )}
              />
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 pt-0">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            className="flex-1"
          >
            Skip Tour
          </Button>
          
          <Button 
            onClick={handleNext}
            className="flex-1 gap-2"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Complete
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}