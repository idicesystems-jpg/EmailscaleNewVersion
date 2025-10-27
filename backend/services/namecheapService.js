const axios = require('axios');
const xml2js = require('xml2js');
require('dotenv').config();

class NamecheapService {
  constructor() {
    this.client = axios.create();
    this.apiUser = process.env.NAMECHEAP_API_USER;
    this.apiKey = process.env.NAMECHEAP_API_KEY;
    this.userName = process.env.NAMECHEAP_USERNAME;
    this.clientIp = process.env.NAMECHEAP_CLIENT_IP;
    this.endpoint = process.env.NAMECHEAP_ENDPOINT || 'https://api.namecheap.com/xml.response';
  }

  /** Utility: Parse XML to JS */
  async parseXml(xmlData) {
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    return await parser.parseStringPromise(xmlData);
  }

  /** Utility: Get TLD pricing */
  async getDomainPricing(tlds) {
    try {
      const url = `${this.endpoint}?ApiUser=${this.apiUser}&ApiKey=${this.apiKey}&UserName=${this.userName}&ClientIp=${this.clientIp}&Command=namecheap.users.getPricing&ProductType=DOMAIN&ActionName=REGISTER&ProductCategory=DOMAINS`;
      const response = await this.client.get(url);
      const parsed = await this.parseXml(response.data);

      const products =
        parsed?.ApiResponse?.CommandResponse?.UserGetPricingResult?.ProductType?.ProductCategory?.Product || [];

      const pricing = {};
      const productArray = Array.isArray(products) ? products : [products];

      productArray.forEach((product) => {
        const tld = product?.Name;
        if (tlds.includes(tld)) {
          pricing[tld] = [];
          const prices = Array.isArray(product.Price) ? product.Price : [product.Price];
          prices.forEach((price) => {
            const usd = parseFloat(price.Price || 0);
            const gbp = usd + 8;
            pricing[tld].push({
              duration: parseInt(price.Duration || 1),
              price: gbp.toFixed(2),
              currency: 'GBP',
              regular_price: gbp.toFixed(2),
              promotion_price: gbp.toFixed(2),
              namecheap_usd_price: usd,
            });
          });
        }
      });

      return pricing;
    } catch (err) {
      console.error('getDomainPricing Error:', err.message);
      return {};
    }
  }

  /** MAIN: Search Alternate Domains */
  async searchAlternateDomains0(domainName, count = 1) {
    try {
      let availableDomains = [];
      let checkedDomains = [];
      let unavailableDomain = null;

      const prefixes = [
        'get', 'xyz', 'use', 'go', 'my', 'trial', 'just', 'team', 'hey', 'meet', 'the',
        'your', 'join', 'at', 'hi', 'with', 'by', 'hello', 'new', 'hq', 'only', 'why',
        'test', 'send', 'engage', 'email', 'via', 'contact', 'run', 'connect', 'connectwith',
        'connection', 'maybe', 'reach', 'info', 'start', 'discover', 'begin', 'learn',
        'explore', 'reachout', 'choose', 'access', 'chat', 'sync', 'talk', 'inbox',
        'enquiries', 'meetteam', 'meetsquad', 'one', 'top'
      ];
      const postfixes = prefixes;

      const [mainName, tld = 'com'] = domainName.split('.');

      if (!count || count === 1) {
        checkedDomains.push(domainName);
      } else {
        let i = 0;
        while (checkedDomains.length < count * 3) {
          if (i < prefixes.length) checkedDomains.push(`${prefixes[i]}${mainName}.${tld}`);
          else {
            const postfixIndex = (i - prefixes.length) % postfixes.length;
            checkedDomains.push(`${mainName}${postfixes[postfixIndex]}.${tld}`);
          }
          i++;
        }
      }

      checkedDomains = [...new Set(checkedDomains)];
      const tlds = [...new Set(checkedDomains.map(d => d.split('.').pop()))];
      const pricing = await this.getDomainPricing(tlds);

      while (availableDomains.length < count && checkedDomains.length > 0) {
        const batch = checkedDomains.splice(0, 10);
        const url = `${this.endpoint}?ApiUser=${this.apiUser}&ApiKey=${this.apiKey}&UserName=${this.userName}&ClientIp=${this.clientIp}&Command=namecheap.domains.check&DomainList=${batch.join(',')}`;
        const response = await this.client.get(url);
        const parsed = await this.parseXml(response.data);

        if (parsed.ApiResponse.Status === 'ERROR') {
          console.error('Namecheap API returned error:', parsed.ApiResponse.Errors);
          return { error: parsed.ApiResponse.Errors?.Error || 'Namecheap error' };
        }

        const domainResults = parsed?.ApiResponse?.CommandResponse?.DomainCheckResult;
        if (!domainResults) {
          console.error('Invalid Namecheap API structure:', parsed);
          return { error: 'Invalid response structure' };
        }

        const domainList = Array.isArray(domainResults) ? domainResults : [domainResults];

        for (const domain of domainList) {
          const dname = domain.Domain;
          const dtld = dname.split('.').pop();
          const isAvailable = domain.Available === 'true';

          if (isAvailable && availableDomains.length < count) {
            availableDomains.push({
              name: dname,
              tld: dtld,
              is_premium: domain.IsPremiumName === 'true',
              premium_registration_price: parseFloat(domain.PremiumRegistrationPrice || 0),
              premium_renewal_price: parseFloat(domain.PremiumRenewalPrice || 0),
              icann_fee: parseFloat(domain.IcannFee || 0),
              other_info: pricing[dtld] || {},
            });
          } else if (!isAvailable && (!count || count === 1)) {
            unavailableDomain = { name: dname, tld: dtld, is_available: false };
          }
        }

        if (availableDomains.length >= count || checkedDomains.length === 0) break;
      }

      const result = {
        available_domains: availableDomains.slice(0, count),
        requested_count: count,
        returned_count: availableDomains.length,
      };
      if (unavailableDomain) result.unavailable_domain = unavailableDomain;
      return { original: result };
    } catch (err) {
      console.error('searchAlternateDomains Error:', err.message);
      return { error: err.message };
    }
  }
  async realSearchAlternateDomains(domainName, count = 3) {
    try {
      const url = `${this.endpoint}?ApiUser=${this.apiUser}&ApiKey=${this.apiKey}&UserName=${this.userName}&ClientIp=${this.clientIp}&Command=namecheap.domains.check&DomainList=${domainName}`;
      const response = await this.client.get(url);

      const parser = new xml2js.Parser({ explicitArray: false });
      const parsed = await parser.parseStringPromise(response.data);

      if (parsed.ApiResponse.$.Status === "ERROR") {
        console.error("Namecheap API Returned Error:", parsed.ApiResponse.Errors.Error);
        return { error: parsed.ApiResponse.Errors.Error };
      }

      const domains = parsed.ApiResponse.CommandResponse.DomainCheckResult || [];
      return {
        status: true,
        message: "Domain availability fetched successfully",
        data: Array.isArray(domains) ? domains : [domains],
      };
    } catch (error) {
      console.error("Namecheap API Error:", error.message);
      throw new Error("Failed to check domain availability");
    }
  }

  /**
   * Mocked function for local development
   */
  async mockSearchAlternateDomains(domainName, count = 3) {
    console.log("⚠️ Using MOCK Namecheap API (local mode)");
    const suggestions = Array.from({ length: count }, (_, i) => ({
      name: `${domainName.replace(/\..*/, "")}-${i + 1}.com`,
      tld: "com",
      is_premium: false,
      premium_registration_price: 0,
      premium_renewal_price: 0,
      icann_fee: 0.18,
    }));

    return {
      status: true,
      message: "Mocked domain availability data",
      data: suggestions,
    };
  }
  async searchAlternateDomains(domainName, count = 3) {
    if (process.env.NODE_ENV === "production") {
      // Use real Namecheap API on production server
      return await this.realSearchAlternateDomains(domainName, count);
    } else {
      // Use mock data locally
      return await this.mockSearchAlternateDomains(domainName, count);
    }
  }

  /** Check User Balance */
  async checkUserBalance() {
    try {
      const url = `${this.endpoint}?ApiUser=${this.apiUser}&ApiKey=${this.apiKey}&UserName=${this.userName}&ClientIp=${this.clientIp}&Command=namecheap.users.getBalances`;
      const response = await this.client.get(url);
      const parsed = await this.parseXml(response.data);
      const balances = parsed?.ApiResponse?.CommandResponse?.UserGetBalancesResult;

      if (!balances) return { error: 'Invalid response structure' };

      return {
        available_balance: balances.AvailableBalance,
        account_balance: balances.AccountBalance,
        currency: balances.Currency,
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  /** Set Custom DNS */
  async setCustomDNS(domain, tld, nameServers = []) {
    try {
      const url = `${this.endpoint}?ApiUser=${this.apiUser}&ApiKey=${this.apiKey}&UserName=${this.userName}&ClientIp=${this.clientIp}&Command=namecheap.domains.dns.setCustom&SLD=${domain}&TLD=${tld}&NameServers=${nameServers.join(',')}`;
      const response = await this.client.get(url);
      const parsed = await this.parseXml(response.data);

      const dnsResult = parsed?.ApiResponse?.CommandResponse?.DomainDNSSetCustomResult;
      if (!dnsResult) return { error: 'Invalid response structure' };

      return {
        success: dnsResult.IsSuccess === 'true',
        data: dnsResult,
      };
    } catch (err) {
      return { error: err.message };
    }
  }
}

module.exports = NamecheapService;
