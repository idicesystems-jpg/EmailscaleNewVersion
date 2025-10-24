const axios = require("axios");
const xml2js = require("xml2js");

class NamecheapService {
  constructor() {
    this.apiUser = process.env.NAMECHEAP_API_USER;
    this.apiKey = process.env.NAMECHEAP_API_KEY;
    this.userName = process.env.NAMECHEAP_USERNAME;
    this.clientIp = process.env.NAMECHEAP_CLIENT_IP || "127.0.0.1";
    this.endpoint =
      process.env.NAMECHEAP_ENDPOINT ||
      "https://api.namecheap.com/xml.response";
  }

  // 🔹 Fetch domain pricing for TLDs
  async getDomainPricing(tlds) {
    const pricing = {};
    try {
      for (const tld of tlds) {
        const response = await axios.get(this.endpoint, {
          params: {
            ApiUser: this.apiUser,
            ApiKey: this.apiKey,
            UserName: this.userName,
            ClientIp: this.clientIp,
            Command: "namecheap.users.getPricing",
            ProductType: "DOMAIN",
            ProductCategory: "REGISTER",
            PromotionCode: "",
            ActionName: "",
            ProductName: tld,
          },
        });

        const parsed = await xml2js.parseStringPromise(response.data, {
          explicitArray: false,
        });

        const pricingData =
          parsed?.ApiResponse?.CommandResponse?.UserGetPricingResult
            ?.ProductType?.ProductCategory?.Product?.Price || [];

        pricing[tld] = Array.isArray(pricingData)
          ? { registration_price: pricingData[0]?.Price }
          : {};
      }
    } catch (err) {
      console.error("Error fetching pricing:", err.message);
    }
    return pricing;
  }

  // 🔹 Main function: check alternate domain availability
  async searchAlternateDomains(domainName, count = 1) {
    try {
      const prefixes = [
        "get","xyz","use","go","my","trial","just","team","hey","meet","the","your","join","at","hi","with","by",
        "hello","new","hq","only","why","test","send","engage","email","via","contact","run","connect","connectwith",
        "connection","maybe","reach","info","start","discover","begin","learn","explore","reachout","choose","access",
        "chat","sync","talk","inbox","enquiries","meetteam","meetsquad","one","top",
      ];
      const postfixes = prefixes;

      const checkedDomains = [];
      const availableDomains = [];
      let unavailableDomain = null;

      // ✅ Generate domain combinations
      if (!count || count == 1) {
        checkedDomains.push(domainName);
      } else {
        let i = 0;
        while (checkedDomains.length < count * 3) {
          if (i < prefixes.length) {
            checkedDomains.push(prefixes[i] + domainName);
          } else {
            const [mainName, tld = "com"] = domainName.split(".");
            const postfixIndex = (i - prefixes.length) % postfixes.length;
            checkedDomains.push(`${mainName}${postfixes[postfixIndex]}.${tld}`);
          }
          i++;
        }
      }

      const uniqueDomains = [...new Set(checkedDomains)];
      const tlds = [...new Set(uniqueDomains.map((d) => d.split(".").pop()))];

      // ✅ Get pricing
      const pricing = await this.getDomainPricing(tlds);

      // ✅ Check availability in batches
      while (availableDomains.length < count && uniqueDomains.length > 0) {
        const batch = uniqueDomains.splice(0, 10);

        const response = await axios.get(this.endpoint, {
          params: {
            ApiUser: this.apiUser,
            ApiKey: this.apiKey,
            UserName: this.userName,
            ClientIp: this.clientIp,
            Command: "namecheap.domains.check",
            DomainList: batch.join(","),
          },
        });

        const parsed = await xml2js.parseStringPromise(response.data, {
          explicitArray: false,
        });

        // 🧩 SAFER STRUCTURE CHECK
        const commandResponse =
          parsed?.ApiResponse?.CommandResponse ||
          parsed?.ApiResponse?.CommandResponse?.[0];

        if (!commandResponse || !commandResponse.DomainCheckResult) {
          const errMsg =
            parsed?.ApiResponse?.Errors?.Error ||
            "Invalid or unexpected Namecheap response structure";
          console.error("❌ Namecheap response error:", errMsg);
          throw new Error(
            typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg
          );
        }

        let results = commandResponse.DomainCheckResult;
        if (!Array.isArray(results)) results = [results];

        for (const d of results) {
          const attrs = d.$ || {};
          const name = attrs.Domain;
          const tld = name.split(".").pop();
          const isAvailable = attrs.Available === "true";

          if (isAvailable && availableDomains.length < count) {
            availableDomains.push({
              name,
              tld,
              is_premium: attrs.IsPremiumName === "true",
              premium_registration_price: parseFloat(
                attrs.PremiumRegistrationPrice || 0
              ),
              premium_renewal_price: parseFloat(attrs.PremiumRenewalPrice || 0),
              icann_fee: parseFloat(attrs.IcannFee || 0),
              other_info: pricing[tld] || {},
            });
          } else if (!isAvailable && (!count || count == 1)) {
            unavailableDomain = { name, tld, is_available: false };
          }
        }
      }

      const sliced = availableDomains.slice(0, count);

      const responseData = {
        available_domains: sliced,
        requested_count: count,
        returned_count: sliced.length,
      };

      if (unavailableDomain)
        responseData.unavailable_domain = unavailableDomain;

      return responseData;
    } catch (err) {
      console.error("💥 Error in searchAlternateDomains:", err);
      throw new Error(
        typeof err === "object" && err.message
          ? err.message
          : JSON.stringify(err)
      );
    }
  }
    async searchDomains(query) {
    try {
      // Step 1️⃣: Perform the domain search
      const response = await axios.get(this.endpoint, {
        params: {
          ApiUser: this.apiUser,
          ApiKey: this.apiKey,
          UserName: this.userName,
          ClientIp: this.clientIp,
          Command: "namecheap.domains.check",
          DomainList: query,
        },
      });

      const xml = await xml2js.parseStringPromise(response.data, {
        explicitArray: false,
      });

      // Check if the response contains DomainCheckResult
      const results =
        xml?.ApiResponse?.CommandResponse?.DomainCheckResult;
      if (!results) {
        return { error: "Invalid response structure" };
      }

      // Step 2️⃣: Extract unique TLDs
      const domainArray = Array.isArray(results) ? results : [results];
      const tlds = [
        ...new Set(
          domainArray.map((domain) =>
            domain.$.Domain.split(".").pop()
          )
        ),
      ];

      // Step 3️⃣: Get pricing for those TLDs
      const pricing = await this.getDomainPricing(tlds);

      // Step 4️⃣: Combine search + pricing info
      const domains = domainArray.map((domain) => {
        const name = domain.$.Domain;
        const tld = name.split(".").pop();

        return {
          name,
          tld,
          available: domain.$.Available === "true",
          is_premium: domain.$.IsPremiumName === "true",
          premium_registration_price: parseFloat(
            domain.$.PremiumRegistrationPrice || 0
          ),
          premium_renewal_price: parseFloat(
            domain.$.PremiumRenewalPrice || 0
          ),
          icann_fee: parseFloat(domain.$.IcannFee || 0),
          other_info: pricing[tld] || [],
        };
      });

      return domains;
    } catch (error) {
      return { error: error.message };
    }
  }
}



module.exports = new NamecheapService();
