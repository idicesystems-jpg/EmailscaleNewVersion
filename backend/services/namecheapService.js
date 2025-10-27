const axios = require("axios");
const xml2js = require("xml2js");

class NamecheapService {
  constructor() {
    this.client = axios.create();
    this.apiUser = process.env.NAMECHEAP_API_USER;
    this.apiKey = process.env.NAMECHEAP_API_KEY;
    this.userName = process.env.NAMECHEAP_USERNAME;
    this.clientIp = process.env.NAMECHEAP_CLIENT_IP;
    this.endpoint = process.env.NAMECHEAP_ENDPOINT;
  }

  // 🧩 Mock domain pricing (like getDomainPricing in Laravel)
  async getDomainPricing(tlds) {
    const mockPricing = {};
    tlds.forEach((tld) => {
      mockPricing[tld] = {
        registration_price: 9.99,
        renewal_price: 11.99,
        transfer_price: 8.99,
        currency: "USD",
      };
    });
    return mockPricing;
  }

  async searchAlternateDomains(domainName, count = 3) {
    try {
      const availableDomains = [];
      let checkedDomains = [];
      let unavailableDomain = null;

      const prefixes = [
        "get", "xyz", "use", "go", "my", "trial", "just", "team", "hey", "meet",
        "the", "your", "join", "at", "hi", "with", "by", "hello", "new", "hq",
        "only", "why", "test", "send", "engage", "email", "via", "contact", "run",
        "connect", "connectwith", "connection", "maybe", "reach", "info", "start",
        "discover", "begin", "learn", "explore", "reachout", "choose", "access",
        "chat", "sync", "talk", "inbox", "enquiries", "meetteam", "meetsquad",
        "one", "top"
      ];
      const postfixes = prefixes;

      // --- Generate potential domain names ---
      if (!count || count === 1) {
        checkedDomains.push(domainName);
      } else {
        const domainParts = domainName.split(".");
        const mainName = domainParts[0];
        const tld = domainParts[1] || "com";

        let i = 0;
        while (checkedDomains.length < count * 3) {
          if (i < prefixes.length) {
            checkedDomains.push(`${prefixes[i]}${mainName}.${tld}`);
          } else {
            const postfixIndex = (i - prefixes.length) % postfixes.length;
            checkedDomains.push(`${mainName}${postfixes[postfixIndex]}.${tld}`);
          }
          i++;
        }
      }

      checkedDomains = [...new Set(checkedDomains)];

      const tlds = [...new Set(checkedDomains.map((d) => d.split(".").pop()))];
      const pricing = await this.getDomainPricing(tlds);

      // --- For local dev, skip real API ---
      if (process.env.NODE_ENV !== "production") {
        console.log("⚠️ Using MOCK Namecheap API (local mode)");
        const mockData = checkedDomains.slice(0, count).map((d) => {
          const tld = d.split(".").pop();
          return {
            name: d,
            tld,
            is_premium: false,
            premium_registration_price: 0.0,
            premium_renewal_price: 0.0,
            icann_fee: 0.18,
            other_info: pricing[tld] || {},
          };
        });

        return {
          original: {
            available_domains: mockData,
            requested_count: count,
            returned_count: mockData.length,
          },
        };
      }

      // --- Production mode: Real Namecheap API call ---
      while (availableDomains.length < count && checkedDomains.length > 0) {
        const batchDomains = checkedDomains.splice(0, 10);
        const url = `${this.endpoint}?ApiUser=${this.apiUser}&ApiKey=${this.apiKey}&UserName=${this.userName}&ClientIp=${this.clientIp}&Command=namecheap.domains.check&DomainList=${batchDomains.join(",")}`;

        const response = await this.client.get(url);
        const parser = new xml2js.Parser({ explicitArray: false });
        const parsed = await parser.parseStringPromise(response.data);

        const domainResults = parsed?.ApiResponse?.CommandResponse?.DomainCheckResult;
        if (!domainResults) {
          console.error("Invalid Namecheap API structure:", parsed);
          break;
        }

        const domains = Array.isArray(domainResults)
          ? domainResults
          : [domainResults];

        for (const domain of domains) {
          const name = domain["$"].Domain;
          const tld = name.split(".").pop();
          const isAvailable = domain["$"].Available === "true";

          if (isAvailable && availableDomains.length < count) {
            availableDomains.push({
              name,
              tld,
              is_premium: domain["$"].IsPremiumName === "true",
              premium_registration_price: parseFloat(domain["$"].PremiumRegistrationPrice || 0),
              premium_renewal_price: parseFloat(domain["$"].PremiumRenewalPrice || 0),
              icann_fee: parseFloat(domain["$"].IcannFee || 0),
              other_info: pricing[tld] || {},
            });
          } else if (!isAvailable && (count === 1 || !count)) {
            unavailableDomain = { name, tld, is_available: false };
          }
        }
      }

      const responseData = {
        available_domains: availableDomains.slice(0, count),
        requested_count: count,
        returned_count: availableDomains.length,
      };

      if (unavailableDomain) responseData.unavailable_domain = unavailableDomain;

      return { original: responseData };
    } catch (error) {
      console.error("Namecheap API Error:", error.message);
      return { error: error.message };
    }
  }
}

module.exports =  NamecheapService;
