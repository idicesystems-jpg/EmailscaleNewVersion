import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionGate } from "@/components/SubscriptionGate";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Plus,
  Globe,
  CreditCard,
  User,
  AtSign,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useCheckAlternateDomainAvailabilityMutation,
  useCreatePaymentIntentMutation,
} from "@/services/adminDomainService";

const InboxOrdering = () => {
  const { user, token, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );
  console.log("user", user);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<"domains" | "payment" | "inboxes">(
    "domains"
  );
  const [domainEmails, setDomainEmails] = useState({});
  const [inboxCount, setInboxCount] = useState(9);
  const [brandNames, setBrandNames] = useState([""]);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<
    Array<{ brand: string; extension: string }>
  >([]);
  const [generatedDomains, setGeneratedDomains] = useState<
    Array<{ name: string; price: number }>
  >([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [domainForwarding, setDomainForwarding] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [useUniformNames, setUseUniformNames] = useState(true);
  const [sameEmailsForAllDomains, setSameEmailsForAllDomains] = useState(true);
  const [emailAddresses, setEmailAddresses] = useState<
    Array<{
      firstName: string;
      lastName: string;
      prefix: string;
      domain: string;
    }>
  >([
    { firstName: "", lastName: "", prefix: "", domain: "" },
    { firstName: "", lastName: "", prefix: "", domain: "" },
    { firstName: "", lastName: "", prefix: "", domain: "" },
  ]);

  console.log("domainEmails", domainEmails);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPackage, setUserPackage] = useState<string>("starter");
  const [currentInboxCount, setCurrentInboxCount] = useState(0);

  const packageLimits = {
    starter: 30,
    professional: 100,
    business: 100,
    unlimited: 999999,
  };

  useEffect(() => {
    checkUserPackageAndInboxes();
  }, []);

  // Handle return from Stripe checkout
  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    console.log("[INBOX-ORDERING] Payment callback triggered", {
      payment,
      sessionId,
    });

    if (payment === "success" && sessionId) {
      // Process the successful payment by retrieving pending order from database
      processPendingOrder(sessionId);

      // Clean up URL params
      setSearchParams({});
    } else if (payment === "cancelled") {
      console.log("[INBOX-ORDERING] Payment was cancelled");
      toast({
        title: "Payment Cancelled",
        description:
          "Your payment was cancelled. You can try again when ready.",
        variant: "destructive",
      });
      setStep("payment");
      // Clean up URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  const processPendingOrder = async (sessionId: string) => {
    console.log(
      "[INBOX-ORDERING] Processing pending order for session:",
      sessionId
    );
    setIsSubmitting(true);

    try {
      // Find the pending order by session ID
      const { data: pendingOrders, error: fetchError } = await supabase
        .from("pending_orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error(
          "[INBOX-ORDERING] Error fetching pending order:",
          fetchError
        );
        throw fetchError;
      }

      if (!pendingOrders || pendingOrders.length === 0) {
        console.error(
          "[INBOX-ORDERING] No pending order found for session:",
          sessionId
        );
        toast({
          title: "Order Not Found",
          description:
            "Could not find your order details. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const pendingOrder = pendingOrders[0];
      console.log("[INBOX-ORDERING] Found pending order:", pendingOrder);

      // Restore state and create everything
      await createDomainsAndNotify(pendingOrder);

      // Mark pending order as completed
      await supabase
        .from("pending_orders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", pendingOrder.id);
    } catch (error: any) {
      console.error("[INBOX-ORDERING] Error processing pending order:", error);
      toast({
        title: "Processing Error",
        description:
          error.message ||
          "Failed to process your order. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkUserPackageAndInboxes = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, stripe_product_id")
      .eq("id", user.id)
      .maybeSingle();

    const { count } = await supabase
      .from("inboxes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Map subscription plan to package
    let packageName = "starter";
    const plan = profile?.subscription_plan?.toLowerCase() || "starter";

    if (plan.includes("unlimited") || plan.includes("enterprise")) {
      packageName = "unlimited";
    } else if (
      plan.includes("professional") ||
      plan.includes("pro") ||
      plan.includes("premium") ||
      plan.includes("business")
    ) {
      packageName = plan.includes("business") ? "business" : "professional";
    } else {
      packageName = "starter";
    }

    console.log(
      "User subscription plan:",
      profile?.subscription_plan,
      "-> Package:",
      packageName
    );
    setUserPackage(packageName);
    setCurrentInboxCount(count || 0);
  };

  const getRemainingInboxes = () => {
    const limit =
      packageLimits[userPackage as keyof typeof packageLimits] || 30;
    return limit - currentInboxCount;
  };

  const canOrderInboxes = (count: number) => {
    // Restriction removed - allow unlimited orders
    return true;
  };

  // Generate smart email prefix suggestions based on first/last name
  const generateEmailPrefixes = (first: string, last: string): string[] => {
    if (!first || !last) return ["", "", ""];

    const firstLower = first.toLowerCase();
    const lastLower = last.toLowerCase();
    const firstInitial = firstLower.charAt(0);
    const lastInitial = lastLower.charAt(0);

    return [
      firstLower, // e.g., "jason"
      `${firstInitial}${lastInitial}`, // e.g., "jc"
      `${firstLower}.${lastLower}`, // e.g., "jason.cunningham"
    ];
  };

  // Update email prefixes when first/last name changes (only if using uniform names and same emails for all domains)
  const updateEmailPrefixesFromName = () => {
    if (useUniformNames && sameEmailsForAllDomains && firstName && lastName) {
      const prefixes = generateEmailPrefixes(firstName, lastName);
      const newAddresses = emailAddresses.map((email, index) => ({
        ...email,
        prefix: prefixes[index] || email.prefix,
      }));
      setEmailAddresses(newAddresses);
    }
  };

  const extensions = [
    { name: ".com", price: 15 },
    { name: ".co.uk", price: 15 },
    { name: ".info", price: 10 },
    { name: ".biz", price: 10 },
    { name: ".online", price: 10 },
    { name: ".net", price: 10 },
    { name: ".org", price: 10 },
    { name: ".app", price: 10 },
    { name: ".co", price: 10 },
    { name: ".email", price: 10 },
    { name: ".tech", price: 10 },
  ];

  const prefixes = ["try", "get", "use", "my", "go", "hey", "hi", "the", "new"];
  const suffixes = [
    "app",
    "mail",
    "email",
    "hub",
    "hq",
    "io",
    "pro",
    "plus",
    "now",
    "go",
  ];

  const domainsNeeded = Math.ceil(inboxCount / 3);

  const toggleExtension = (extName: string) => {
    if (selectedExtensions.includes(extName)) {
      setSelectedExtensions(selectedExtensions.filter((e) => e !== extName));
    } else {
      setSelectedExtensions([...selectedExtensions, extName]);
    }
  };

  //   const [checkAlternateDomainAvailability] =
  //     useCheckAlternateDomainAvailabilityMutation({
  //   "domain_name": "profit-maximize",
  //   "domain_type": ".com"
  // });

  //console.log("checkAlternateDomainAvailability:", checkAlternateDomainAvailability);

  //console.log("brandNames", brandNames);
  //console.log("selectedExtensions", selectedExtensions);

  // const [
  //   checkAlternateDomainAvailability,
  //   { data: apiData, isLoading, isError },
  // ] = useCheckAlternateDomainAvailabilityMutation();

  // useEffect(() => {
  //   if (brandNames.length && selectedExtensions.length) {
  //     checkAlternateDomainAvailability({
  //       domain_name: brandNames,
  //       domain_type: selectedExtensions,
  //     });
  //   }
  // }, [brandNames, selectedExtensions]);

  const apiData = {
    success: true,
    results: [
      {
        domain: "idice.com",
        available: false,
        isPremium: false,
        price: {
          registration: 11.28,
          currency: "USD",
        },
      },
      {
        domain: "idice.net",
        available: true,
        isPremium: false,
        price: {
          registration: 12.9,
          currency: "USD",
        },
      },
      {
        domain: "idice.org",
        available: false,
        isPremium: false,
        price: {
          registration: null,
          currency: null,
        },
      },
    ],
  };

  // Convert API response into extension objects:
  // const apiExtensions = apiData?.results?.map((item) => ({
  //   name: "." + item.domain.split(".")[1],     // .com / .net / .org
  //   price: item.price.registration ?? 0,       // API price
  //   domain: item.domain                        // full domain if needed
  // }));

  const apiExtensions = apiData?.results?.map((item) => ({
    name: "." + item.domain.split(".").slice(1).join("."),
    price: item.price.registration ?? 0,
    domain: item.domain,
  }));

  console.log("apiExtensions", apiExtensions);

  const generateAllCombinations = () => {
    const allDomains: Array<{ name: string; price: number }> = [];

    brandNames.forEach((brand) => {
      if (!brand.trim()) return;

      const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Only use extensions from API based on selectedExtensions
      const extsToUse = apiExtensions.filter((ext) =>
        selectedExtensions.includes(ext.name)
      );

      //console.log("extsToUse", extsToUse);

      extsToUse.forEach((ext) => {
        // 1. brand + extension
        allDomains.push({ name: `${cleanBrand}${ext.name}`, price: ext.price });

        // 2. prefix + brand
        //   prefixes.forEach((prefix) => {
        //     allDomains.push({
        //       name: `${prefix}${cleanBrand}${ext.name}`,
        //       price: ext.price,
        //     });
        //   });

        // 3. prefix-brand
        //   prefixes.forEach((prefix) => {
        //     allDomains.push({
        //       name: `${prefix}-${cleanBrand}${ext.name}`,
        //       price: ext.price,
        //     });
        //   });

        // 4. brand + suffix
        //   suffixes.forEach((suffix) => {
        //     allDomains.push({
        //       name: `${cleanBrand}${suffix}${ext.name}`,
        //       price: ext.price,
        //     });
        //   });

        // 5. brand-suffix
        //   suffixes.forEach((suffix) => {
        //     allDomains.push({
        //       name: `${cleanBrand}-${suffix}${ext.name}`,
        //       price: ext.price,
        //     });
        //   });

        // 6. prefix + brand + suffix
        //   prefixes.slice(0, 3).forEach((prefix) => {
        //     suffixes.slice(0, 3).forEach((suffix) => {
        //       allDomains.push({
        //         name: `${prefix}${cleanBrand}${suffix}${ext.name}`,
        //         price: ext.price,
        //       });
        //     });
        //   });
      });
    });

    //console.log("allDomains", allDomains);
    const uniqueDomains = [
      ...new Map(allDomains.map((d) => [d.name, d])).values(),
    ];
    // Remove duplicates
    //   const uniqueDomains = Array.from(
    //     new Map(allDomains.map((d) => [d.name, d])).values()
    //   );

    //setGeneratedDomains(uniqueDomains);
    setGeneratedDomains(uniqueDomains);
  };

  //   const generateAllCombinations = () => {
  //     const allDomains: Array<{ name: string; price: number }> = [];

  // 	console.log("allDomains",allDomains)
  // 	console.log("selectedExtensions",selectedExtensions);

  //     brandNames.forEach((brand) => {
  //       if (!brand.trim()) return;

  //       const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, "");

  //       // Only use selected extensions
  //       const extsToUse = extensions.filter((ext) =>
  //         selectedExtensions.includes(ext.name)
  //       );

  //       extsToUse.forEach((ext) => {
  //         // 1. Direct brand + extension
  //         allDomains.push({ name: `${cleanBrand}${ext.name}`, price: ext.price });

  //         // 2. Prefix + brand (no hyphen)
  //         prefixes.forEach((prefix) => {
  //           allDomains.push({
  //             name: `${prefix}${cleanBrand}${ext.name}`,
  //             price: ext.price,
  //           });
  //         });

  //         // 3. Prefix + hyphen + brand
  //         prefixes.forEach((prefix) => {
  //           allDomains.push({
  //             name: `${prefix}-${cleanBrand}${ext.name}`,
  //             price: ext.price,
  //           });
  //         });

  //         // 4. Brand + suffix (no hyphen)
  //         suffixes.forEach((suffix) => {
  //           allDomains.push({
  //             name: `${cleanBrand}${suffix}${ext.name}`,
  //             price: ext.price,
  //           });
  //         });

  //         // 5. Brand + hyphen + suffix
  //         suffixes.forEach((suffix) => {
  //           allDomains.push({
  //             name: `${cleanBrand}-${suffix}${ext.name}`,
  //             price: ext.price,
  //           });
  //         });

  //         // 6. Prefix + brand + suffix (no hyphens)
  //         prefixes.slice(0, 3).forEach((prefix) => {
  //           suffixes.slice(0, 3).forEach((suffix) => {
  //             allDomains.push({
  //               name: `${prefix}${cleanBrand}${suffix}${ext.name}`,
  //               price: ext.price,
  //             });
  //           });
  //         });
  //       });
  //     });

  //     // Remove duplicates
  //     const uniqueDomains = Array.from(
  //       new Map(allDomains.map((d) => [d.name, d])).values()
  //     );

  //     setGeneratedDomains(uniqueDomains);
  //   };

  const addBrandName = () => {
    setBrandNames([...brandNames, ""]);
  };

  const removeBrandName = (index: number) => {
    if (brandNames.length > 1) {
      setBrandNames(brandNames.filter((_, i) => i !== index));
    }
  };

  const updateBrandName = (index: number, value: string) => {
    const newBrands = [...brandNames];
    newBrands[index] = value;
    setBrandNames(newBrands);
  };

  const toggleDomain = (domainName: string) => {
    const domain = generatedDomains.find((d) => d.name === domainName);
    if (!domain) return;

    const extName =
      apiExtensions.find((e) => domainName.endsWith(e.name))?.name || ".com";
    const brandPart = domainName.replace(extName, "");

    const exists = selectedDomains.some(
      (sel) => `${sel.brand}${sel.extension}` === domainName
    );

    if (exists) {
      setSelectedDomains(
        selectedDomains.filter(
          (sel) => `${sel.brand}${sel.extension}` !== domainName
        )
      );
    } else if (selectedDomains.length < domainsNeeded) {
      setSelectedDomains([
        ...selectedDomains,
        { brand: brandPart, extension: extName },
      ]);
    }
  };

  const totalPrice = selectedDomains.reduce((sum, sel) => {
    const ext = apiExtensions.find((e) => e.name === sel.extension);
    return sum + (ext?.price || 0);
  }, 0);

  //   const toggleDomain = (domainName: string) => {
  //     const domain = generatedDomains.find((d) => d.name === domainName);
  //     if (!domain) return;

  //     const extName =
  //       extensions.find((e) => domainName.endsWith(e.name))?.name || ".com";
  //     const brandPart = domainName.replace(extName, "");

  //     const exists = selectedDomains.some(
  //       (sel) => `${sel.brand}${sel.extension}` === domainName
  //     );

  //     if (exists) {
  //       setSelectedDomains(
  //         selectedDomains.filter(
  //           (sel) => `${sel.brand}${sel.extension}` !== domainName
  //         )
  //       );
  //     } else if (selectedDomains.length < domainsNeeded) {
  //       setSelectedDomains([
  //         ...selectedDomains,
  //         { brand: brandPart, extension: extName },
  //       ]);
  //     }
  //   };

  //   const totalPrice = selectedDomains.reduce((sum, sel) => {
  //     const ext = extensions.find((e) => e.name === sel.extension);
  //     return sum + (ext?.price || 0);
  //   }, 0);

  const fullSelectedDomains = selectedDomains.map(
    (sel) => `${sel.brand}${sel.extension}`
  );

  const domainPrices = selectedDomains.map((sel) => {
    const ext = apiExtensions.find((e) => e.name === sel.extension);
    return ext?.price || 0;
  });

  console.log("fullSelectedDomains", fullSelectedDomains);
  console.log("domainPrices", domainPrices);

  const addEmailAddress = () => {
    if (sameEmailsForAllDomains) {
      setEmailAddresses([
        ...emailAddresses,
        { firstName: "", lastName: "", prefix: "", domain: "" },
      ]);
    }
  };

  const removeEmailAddress = (index: number) => {
    if (emailAddresses.length > 1) {
      setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
    }
  };

  const updateEmailAddress = (
    index: number,
    field: keyof (typeof emailAddresses)[0],
    value: string
  ) => {
    const newAddresses = [...emailAddresses];
    newAddresses[index][field] = value;
    setEmailAddresses(newAddresses);
  };

  const createDomainsAndNotify = async (orderData: any) => {
    console.log("[INBOX-ORDERING] createDomainsAndNotify started", orderData);
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("[INBOX-ORDERING] No authenticated user found");
        toast({
          title: "Error",
          description: "You must be logged in to complete setup",
          variant: "destructive",
        });
        return;
      }

      console.log("[INBOX-ORDERING] User authenticated:", user.id);

      // Step 1: Create domains
      const domainRecords = orderData.selectedDomains.map((sel: any) => ({
        domain_name: `${sel.brand}${sel.extension}`,
        user_id: user.id,
        status: "pending",
        notes: orderData.domainForwarding
          ? `Forward to: ${orderData.websiteUrl}`
          : null,
      }));

      console.log("[INBOX-ORDERING] Creating domain records:", domainRecords);

      const { data: createdDomains, error: domainError } = await supabase
        .from("domains")
        .insert(domainRecords)
        .select();

      if (domainError) {
        console.error("[INBOX-ORDERING] Domain creation error:", domainError);
        throw domainError;
      }

      console.log("[INBOX-ORDERING] Domains created:", createdDomains);

      // Step 2: Create inboxes for each domain
      const inboxRecords = [];
      for (const domain of createdDomains || []) {
        const domainName = domain.domain_name;

        // Create 3 inboxes per domain (or based on emailAddresses length)
        for (let i = 0; i < Math.min(orderData.emailAddresses.length, 3); i++) {
          const emailAddr = orderData.emailAddresses[i];
          const emailAddress = `${emailAddr.prefix}@${domainName}`;

          inboxRecords.push({
            email_address: emailAddress,
            user_id: user.id,
            domain_id: domain.id,
            first_name: orderData.useUniformNames
              ? orderData.firstName
              : emailAddr.firstName || orderData.firstName,
            last_name: orderData.useUniformNames
              ? orderData.lastName
              : emailAddr.lastName || orderData.lastName,
            status: "active",
            health_score: 0,
          });
        }
      }

      console.log("[INBOX-ORDERING] Creating inbox records:", inboxRecords);

      const { data: createdInboxes, error: inboxError } = await supabase
        .from("inboxes")
        .insert(inboxRecords)
        .select();

      if (inboxError) {
        console.error("[INBOX-ORDERING] Inbox creation error:", inboxError);
        throw inboxError;
      }

      console.log("[INBOX-ORDERING] Inboxes created:", createdInboxes);

      // Step 3: Create order record
      const domainNames = orderData.selectedDomains
        .map((sel: any) => `${sel.brand}${sel.extension}`)
        .join(", ");
      const orderSummary = `Domains: ${domainNames} | Inboxes: ${
        (createdInboxes || []).length
      }`;

      console.log("[INBOX-ORDERING] Creating order record");

      const { data: orderRecord, error: orderError } = await supabase
        .from("inbox_orders")
        .insert({
          user_id: user.id,
          order_summary: orderSummary,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) {
        console.error(
          "[INBOX-ORDERING] Order record creation error:",
          orderError
        );
        throw new Error(`Failed to create order record: ${orderError.message}`);
      }

      console.log("[INBOX-ORDERING] Order record created:", orderRecord);

      // Step 4: Send notification to support team
      const orderNotification = {
        userId: user.id,
        domains: orderData.selectedDomains.map(
          (sel: any) => `${sel.brand}${sel.extension}`
        ),
        inboxes: (createdInboxes || []).map((inbox) => {
          const domainName =
            createdDomains?.find((d) => d.id === inbox.domain_id)
              ?.domain_name || "";
          return {
            firstName: inbox.first_name,
            lastName: inbox.last_name,
            emailAddress: inbox.email_address,
            domainName: domainName,
          };
        }),
      };

      console.log("[INBOX-ORDERING] Sending notification email");

      const { error: notificationError } = await supabase.functions.invoke(
        "send-inbox-order-notification",
        {
          body: orderNotification,
        }
      );

      if (notificationError) {
        console.error(
          "[INBOX-ORDERING] Failed to send order notification:",
          notificationError
        );
      } else {
        console.log("[INBOX-ORDERING] Notification sent successfully");
      }

      toast({
        title: "Order Completed!",
        description: `Your order for ${createdDomains?.length} domains and ${createdInboxes?.length} inboxes has been submitted and paid. Our team will process it shortly.`,
      });

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("[INBOX-ORDERING] Setup error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to complete setup",
          variant: "destructive",
        });
        return;
      }

      // Check package limits
      const totalInboxesToCreate =
        selectedDomains.length * Math.min(emailAddresses.length, 3);
      if (!canOrderInboxes(totalInboxesToCreate)) {
        toast({
          title: "Package Limit Exceeded",
          description: `You can only create ${getRemainingInboxes()} more inbox${
            getRemainingInboxes() === 1 ? "" : "es"
          } with your ${userPackage} plan. Please upgrade your package or reduce the number of inboxes.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate that we have email prefixes
      if (
        sameEmailsForAllDomains &&
        emailAddresses.some((email) => !email.prefix.trim())
      ) {
        toast({
          title: "Error",
          description: "Please fill in all email prefixes",
          variant: "destructive",
        });
        return;
      }

      // Step 1: Create domains
      const domainRecords = selectedDomains.map((sel) => ({
        domain_name: `${sel.brand}${sel.extension}`,
        user_id: user.id,
        status: "pending",
        notes: domainForwarding ? `Forward to: ${websiteUrl}` : null,
      }));

      const { data: createdDomains, error: domainError } = await supabase
        .from("domains")
        .insert(domainRecords)
        .select();

      if (domainError) throw domainError;

      // Step 2: Create inboxes for each domain
      const inboxRecords = [];
      for (const domain of createdDomains || []) {
        const domainName = domain.domain_name;

        // Create 3 inboxes per domain (or based on emailAddresses length)
        for (let i = 0; i < Math.min(emailAddresses.length, 3); i++) {
          const emailAddr = emailAddresses[i];
          const emailAddress = `${emailAddr.prefix}@${domainName}`;

          inboxRecords.push({
            email_address: emailAddress,
            user_id: user.id,
            domain_id: domain.id,
            first_name: useUniformNames
              ? firstName
              : emailAddr.firstName || firstName,
            last_name: useUniformNames
              ? lastName
              : emailAddr.lastName || lastName,
            status: "active",
            health_score: 0,
          });
        }
      }

      const { data: createdInboxes, error: inboxError } = await supabase
        .from("inboxes")
        .insert(inboxRecords)
        .select();

      if (inboxError) throw inboxError;

      // Step 3: Create order record first
      const domainNames = fullSelectedDomains.join(", ");
      const orderSummary = `Domains: ${domainNames} | Inboxes: ${
        (createdInboxes || []).length
      }`;

      const { data: orderData, error: orderError } = await supabase
        .from("inbox_orders")
        .insert({
          user_id: user.id,
          order_summary: orderSummary,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order record:", orderError);
        throw new Error(`Failed to create order record: ${orderError.message}`);
      }

      console.log("Order record created successfully:", orderData);

      // Step 4: Send notification to support team
      const orderNotification = {
        userId: user.id,
        domains: fullSelectedDomains,
        inboxes: (createdInboxes || []).map((inbox) => {
          const domainName =
            createdDomains?.find((d) => d.id === inbox.domain_id)
              ?.domain_name || "";
          return {
            firstName: inbox.first_name,
            lastName: inbox.last_name,
            emailAddress: inbox.email_address,
            domainName: domainName,
          };
        }),
      };

      const { error: notificationError } = await supabase.functions.invoke(
        "send-inbox-order-notification",
        {
          body: orderNotification,
        }
      );

      if (notificationError) {
        console.error("Failed to send order notification:", notificationError);
        // Don't fail the whole process if notification fails
      }

      toast({
        title: "Order Submitted!",
        description: `Your order for ${createdDomains?.length} domains and ${createdInboxes?.length} inboxes has been submitted. Our team will process it shortly.`,
      });

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Setup error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log("emailAddresses", emailAddresses);

  const [createPaymentIntent, { data, isLoading }] =
    useCreatePaymentIntentMutation();

  const handlePayment = async () => {
    const payload = {
      save_contact_details: true,
      fname:firstName,
      lname:lastName,
      email:user?.email,
      organization:"Test Company",
      address1:"123 Street",
      address2:"Suite 4",
      postal_code:"W1A 1AA",
      city:"London",
      state:"London",
      country:"IN",
      user_id:user?.id,
      amount: Math.round(totalPrice * 100),
      paymentMethodId: "pm_card_visa",
      result: fullSelectedDomains,
      allamout: domainPrices.map((x) => Math.round(x * 100)),
      domainEmails: domainEmails,
    };

    // const payload = {
    //   save_contact_details: true,
    //   fname: "John",
    //   lname: "Doe",
    //   email: "john@test.com",
    //   organization: "Test Company",
    //   address1: "123 Street",
    //   address2: "Suite 4",
    //   postal_code: "W1A 1AA",
    //   city: "London",
    //   state: "London",
    //   country: "GB",
    //   user_id: 1,
    //   amount: 1000,
    //   paymentMethodId: "pm_card_visa",
    //   result: ["example.com", "mydomain.co"],
    //   allamout: [500, 500],
    // };

    console.log("Creating payment intent with payload:", payload);

    try {
      await createPaymentIntent(payload).unwrap();
      toast({
        title: "Success",
        description: "Payment successful",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Payment failed",
      });

      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <SubscriptionGate>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Inbox Ordering
            </h1>
            <p className="text-muted-foreground">
              Order domains and set up your email inboxes
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "domains"
                    ? "bg-primary text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {step === "domains" ? (
                  "1"
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <span
                className={
                  step === "domains"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                Order Domains
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "inboxes"
                    ? "bg-primary text-white"
                    : step === "payment"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step === "payment" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  "2"
                )}
              </div>
              <span
                className={
                  step === "inboxes"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                Set Up Inboxes
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "payment"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span
                className={
                  step === "payment"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                Payment
              </span>
            </div>
          </div>

          {/* Step 1: Order Domains */}
          {step === "domains" && (
            <div className="space-y-6">
              {/* Inbox Count */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle>How many inboxes do you want?</CardTitle>
                  </div>
                  <CardDescription>
                    We'll calculate the optimal number of domains for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inbox-count">Number of Inboxes</Label>
                    <Input
                      id="inbox-count"
                      type="number"
                      min="1"
                      max={getRemainingInboxes()}
                      value={inboxCount}
                      onChange={(e) => {
                        const count = Math.max(
                          1,
                          parseInt(e.target.value) || 1
                        );
                        if (!canOrderInboxes(count)) {
                          toast({
                            title: "Package Limit Reached",
                            description: `Your ${userPackage} plan allows ${
                              packageLimits[
                                userPackage as keyof typeof packageLimits
                              ]
                            } inboxes. You have ${currentInboxCount} and can order ${getRemainingInboxes()} more. Please upgrade to order more.`,
                            variant: "destructive",
                          });
                          return;
                        }
                        setInboxCount(count);
                      }}
                      placeholder="Enter number of inboxes"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Current: {currentInboxCount}/
                        {packageLimits[
                          userPackage as keyof typeof packageLimits
                        ] === 999999
                          ? "∞"
                          : packageLimits[
                              userPackage as keyof typeof packageLimits
                            ]}
                      </span>
                      <span>
                        Available:{" "}
                        {getRemainingInboxes() === 999999
                          ? "∞"
                          : getRemainingInboxes()}
                      </span>
                    </div>
                  </div>

                  {!canOrderInboxes(inboxCount) && (
                    <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-destructive">
                          Package Limit Exceeded
                        </p>
                        <p className="text-muted-foreground mt-1">
                          You can only order {getRemainingInboxes()} more inbox
                          {getRemainingInboxes() === 1 ? "" : "es"} with your
                          current {userPackage} plan. Please upgrade to order
                          more.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        You'll need {domainsNeeded}{" "}
                        {domainsNeeded === 1 ? "domain" : "domains"}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        We recommend 3 inboxes per domain for optimal
                        deliverability
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Select Extensions First */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle>Choose Domain Extensions</CardTitle>
                  </div>
                  <CardDescription>
                    Select which extensions you want for your domains
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Select Extensions</Label>
                    <div className="flex gap-2">
                      <Badge variant="outline">.com/.co.uk = £15/year</Badge>
                      <Badge variant="outline">Others = £10/year</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {extensions.map((ext) => (
                      <button
                        key={ext.name}
                        onClick={() => toggleExtension(ext.name)}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedExtensions.includes(ext.name)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <p className="font-medium text-sm">{ext.name}</p>
                          <p className="text-xs text-muted-foreground">
                            £{ext.price}/yr
                          </p>
                          {selectedExtensions.includes(ext.name) && (
                            <CheckCircle2 className="h-4 w-4 text-primary mt-1" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedExtensions.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg mt-4">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">
                        {selectedExtensions.length} extension
                        {selectedExtensions.length !== 1 ? "s" : ""} selected.
                        Now add your brand names below.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Brand Names */}
              {selectedExtensions.length > 0 && (
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          <CardTitle>Brand Names</CardTitle>
                        </div>
                        <CardDescription>
                          Enter your brand or company names
                        </CardDescription>
                      </div>
                      {brandNames.length < domainsNeeded && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addBrandName}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Brand
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {brandNames.map((brand, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="e.g., acme, techstart, mycompany"
                          value={brand}
                          onChange={(e) =>
                            updateBrandName(index, e.target.value)
                          }
                        />
                        {brandNames.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeBrandName(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Generate & Select Domains */}
              {selectedExtensions.length > 0 &&
                brandNames.some((b) => b.trim()) && (
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <CardTitle>Find & Select Domains</CardTitle>
                          </div>
                          <CardDescription>
                            {generatedDomains.length > 0
                              ? `Choose ${domainsNeeded} domain${
                                  domainsNeeded === 1 ? "" : "s"
                                } from ${generatedDomains.length} combinations`
                              : `Click to generate domain combinations with your selected extensions`}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={generateAllCombinations}
                          disabled={
                            !brandNames.some((b) => b.trim()) ||
                            selectedExtensions.length === 0
                          }
                        >
                          {generatedDomains.length > 0
                            ? "Regenerate"
                            : "Find Domains"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {generatedDomains.length > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <Label>Available Domain Combinations</Label>
                            <Badge variant="secondary">
                              {selectedDomains.length} / {domainsNeeded}{" "}
                              selected
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto p-1">
                            {generatedDomains.map((domain) => {
                              const fullName = domain.name;
                              const isSelected = selectedDomains.some(
                                (sel) =>
                                  `${sel.brand}${sel.extension}` === fullName
                              );
                              const isDisabled =
                                !isSelected &&
                                selectedDomains.length >= domainsNeeded;

                              return (
                                <button
                                  key={fullName}
                                  onClick={() =>
                                    !isDisabled && toggleDomain(fullName)
                                  }
                                  disabled={isDisabled}
                                  className={`p-3 border-2 rounded-lg transition-all text-left ${
                                    isSelected
                                      ? "border-primary bg-primary/5"
                                      : isDisabled
                                      ? "border-border opacity-50 cursor-not-allowed"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm truncate">
                                        {fullName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        £{domain.price}/year
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {selectedDomains.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label>
                              Selected Domains ({selectedDomains.length})
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedDomains.map((sel, idx) => {
                                const fullName = `${sel.brand}${sel.extension}`;
                                return (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="gap-1"
                                  >
                                    {fullName}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDomain(fullName);
                                      }}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Payment Summary */}
              {selectedDomains.length > 0 && (
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <CardTitle>Payment Summary</CardTitle>
                    </div>
                    <CardDescription>
                      Review your order - 1 year registration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {selectedDomains?.map((sel, idx) => {
                        const ext = apiExtensions?.find(
                          (e) => e.name === sel.extension
                        );
                        const fullName = `${sel.brand}${sel.extension}`;
                        return (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {fullName}
                            </span>
                            <span className="text-foreground font-medium">
                              £{ext?.price}/year
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-foreground">Total (1 year)</span>
                      <span className="text-primary">
                        £{totalPrice.toFixed(2)}
                      </span>
                    </div>
                    {selectedDomains.length < domainsNeeded && (
                      <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">
                          Please select {domainsNeeded - selectedDomains.length}{" "}
                          more{" "}
                          {domainsNeeded - selectedDomains.length === 1
                            ? "domain"
                            : "domains"}{" "}
                          to continue
                        </p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={selectedDomains.length !== domainsNeeded}
                      onClick={() => setStep("inboxes")}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Configure Inboxes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === "payment" && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle>Order Summary</CardTitle>
                  </div>
                  <CardDescription>
                    Review your domain purchases
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {selectedDomains.map((sel, idx) => {
                      const ext = apiExtensions.find(
                        (e) => e.name === sel.extension
                      );
                      const fullName = `${sel.brand}${sel.extension}`;
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {fullName}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            £{ext?.price}/year
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-foreground">Total (1 year)</span>
                    <span className="text-primary">
                      £{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle>Payment Method</CardTitle>
                  </div>
                  <CardDescription>
                    Complete your purchase to continue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">
                        Secure Payment via Stripe
                      </p>
                      <p className="text-muted-foreground">
                        Your payment will be processed securely through Stripe.
                        You'll be redirected to complete your purchase.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Secure 256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>PCI DSS compliant payment processing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>No refunds on domain purchases</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("domains")}
                      className="flex-1"
                      //disabled={isSubmitting}
                    >
                      Back to Inboxes
                    </Button>
                    <Button
                      onClick={handlePayment}
                      // onClick={async () => {
                      //   setIsSubmitting(true);
                      // }}
                      className="flex-1"
                      //disabled={isSubmitting}
                    >
                      {/* {isSubmitting ? (
                        <>Processing...</>
                      ) : ( */}
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay £{totalPrice.toFixed(2)} via Stripe
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                      {/* )} */}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Set Up Inboxes */}
          {step === "inboxes" && (
            <div className="space-y-6">
              {/* User Information */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>User Information</CardTitle>
                  </div>
                  <CardDescription>
                    {useUniformNames
                      ? "This information will be used for all email addresses"
                      : "You can set different names for each email address below"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="uniform-names"
                      checked={useUniformNames}
                      onChange={(e) => setUseUniformNames(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="uniform-names" className="cursor-pointer">
                      Use the same first and last name for all email addresses
                    </Label>
                  </div>

                  {useUniformNames && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (lastName) {
                              setTimeout(updateEmailPrefixesFromName, 0);
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            if (firstName) {
                              setTimeout(updateEmailPrefixesFromName, 0);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Domain Forwarding */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle>Domain Forwarding</CardTitle>
                  </div>
                  <CardDescription>
                    Forward your domains to your website (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="domain-forwarding"
                      checked={domainForwarding}
                      onChange={(e) => setDomainForwarding(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label
                      htmlFor="domain-forwarding"
                      className="cursor-pointer"
                    >
                      Enable domain forwarding to website
                    </Label>
                  </div>

                  {domainForwarding && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            Warning: Not Advised
                          </p>
                          <p className="text-muted-foreground">
                            Domain forwarding damages sending reputation and
                            deliverability
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website-url">Website URL</Label>
                        <Input
                          id="website-url"
                          type="url"
                          placeholder="https://yourwebsite.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          All selected domains will forward to this URL
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Email Addresses */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AtSign className="h-5 w-5 text-primary" />
                        <CardTitle>Email Addresses</CardTitle>
                      </div>
                      <CardDescription>
                        {sameEmailsForAllDomains
                          ? "These 3 email addresses will be created for all your domains"
                          : "Configure different email addresses for each domain"}
                      </CardDescription>
                    </div>
                    {sameEmailsForAllDomains && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addEmailAddress}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Email
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emailAddresses.length > 3 && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          Warning: Not Advised
                        </p>
                        <p className="text-muted-foreground">
                          More than 3 emails per domain damages sending
                          reputation and deliverability
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="same-emails-all-domains"
                      checked={sameEmailsForAllDomains}
                      onChange={(e) => {
                        setSameEmailsForAllDomains(e.target.checked);
                        if (e.target.checked) {
                          setTimeout(updateEmailPrefixesFromName, 0);
                        }
                      }}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label
                      htmlFor="same-emails-all-domains"
                      className="cursor-pointer"
                    >
                      Use the same email addresses for all domains
                    </Label>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-medium">
                        {sameEmailsForAllDomains
                          ? `Total: ${
                              fullSelectedDomains.length * 3
                            } email addresses`
                          : `3 emails per domain (${
                              fullSelectedDomains.length * 3
                            } total)`}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {sameEmailsForAllDomains
                          ? `These 3 email addresses will be created for each of your ${fullSelectedDomains.length} domains`
                          : "Configure 3 unique email addresses for each domain"}
                      </p>
                    </div>
                  </div>

                  {sameEmailsForAllDomains ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        These email addresses will be created across all{" "}
                        {fullSelectedDomains.length} domains
                      </p>

                      {emailAddresses.map((email, index) => (
                        <div
                          key={index}
                          className="space-y-3 p-4 border border-border rounded-lg bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="font-medium text-base">
                              Email Address {index + 1}
                              {index >= 3 && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  Not Advised
                                </Badge>
                              )}
                            </Label>
                            {emailAddresses.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmailAddress(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`email-${index}-prefix`}>
                              Email Prefix
                            </Label>
                            <Input
                              id={`email-${index}-prefix`}
                              placeholder={
                                index === 0
                                  ? "e.g., jason"
                                  : index === 1
                                  ? "e.g., jc"
                                  : "e.g., jason.cunningham"
                              }
                              value={email.prefix}
                              onChange={(e) =>
                                updateEmailAddress(
                                  index,
                                  "prefix",
                                  e.target.value
                                )
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              {index === 0 && "First name suggestion"}
                              {index === 1 && "Initials suggestion"}
                              {index === 2 && "Full name suggestion"}
                            </p>
                          </div>

                          {email.prefix && fullSelectedDomains.length > 0 && (
                            <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-xs text-muted-foreground font-medium">
                                Will create {fullSelectedDomains.length} email
                                addresses:
                              </p>
                              <div className="flex flex-col gap-1">
                                {fullSelectedDomains.map((domain) => (
                                  <div
                                    key={domain}
                                    className="flex items-center gap-2"
                                  >
                                    <Mail className="h-3 w-3 text-primary" />
                                    <span className="text-sm text-foreground font-mono">
                                      {email.prefix}@{domain}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {fullSelectedDomains.map((domain) => (
                        <div
                          key={domain}
                          className="space-y-3 p-4 border-2 border-primary/20 rounded-lg bg-primary/5"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-foreground">
                              {domain}
                            </h3>
                          </div>

                          <div className="space-y-3 pl-2">
                            {[0, 1, 2].map((emailIndex) => (
                              <div
                                key={emailIndex}
                                className="space-y-3 p-3 border border-border rounded-lg bg-background"
                              >
                                <Label className="font-medium text-sm">
                                  Email {emailIndex + 1}
                                </Label>

                                {!useUniformNames && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`${domain}-${emailIndex}-first`}
                                        className="text-xs"
                                      >
                                        First Name
                                      </Label>
                                      <Input
                                        id={`${domain}-${emailIndex}-first`}
                                        placeholder="John"
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`${domain}-${emailIndex}-last`}
                                        className="text-xs"
                                      >
                                        Last Name
                                      </Label>
                                      <Input
                                        id={`${domain}-${emailIndex}-last`}
                                        placeholder="Doe"
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`${domain}-${emailIndex}-prefix`}
                                    className="text-xs"
                                  >
                                    Email Prefix
                                  </Label>
                                  <Input
                                    id={`${domain}-${emailIndex}-prefix`}
                                    placeholder="contact, info, support, etc."
                                    className="h-9 text-sm"
                                    value={
                                      domainEmails[domain]?.[emailIndex] || ""
                                    }
                                    onChange={(e) => {
                                      const updated = [
                                        ...(domainEmails[domain] || [
                                          "",
                                          "",
                                          "",
                                        ]),
                                      ];
                                      updated[emailIndex] = e.target.value;

                                      setDomainEmails({
                                        ...domainEmails,
                                        [domain]: updated,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("domains")}>
                  Back to Domains
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    // Validate first/last name if using uniform names
                    if (
                      useUniformNames &&
                      (!firstName.trim() || !lastName.trim())
                    ) {
                      toast({
                        title: "Missing Name Information",
                        description: "Please fill in first and last name",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Validate email prefixes before proceeding to payment
                    if (
                      sameEmailsForAllDomains &&
                      emailAddresses.some((email) => !email.prefix.trim())
                    ) {
                      toast({
                        title: "Missing Email Prefixes",
                        description:
                          "Please fill in all email prefixes before proceeding to payment",
                        variant: "destructive",
                      });
                      return;
                    }
                    setStep("payment");
                  }}
                  //disabled={isSubmitting}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Payment
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SubscriptionGate>
    </DashboardLayout>
  );
};

export default InboxOrdering;
