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

  async searchAlternateDomains(domainName, count = 1) {
    try {
      const url = `${this.endpoint}?ApiUser=${this.apiUser}&ApiKey=${this.apiKey}&UserName=${this.userName}&ClientIp=${this.clientIp}&Command=namecheap.domains.check&DomainList=${domainName}`;

      const response = await this.client.get(url);
      const parser = new xml2js.Parser({ explicitArray: false });

      const parsed = await parser.parseStringPromise(response.data);
      const domains =
        parsed.ApiResponse.CommandResponse.DomainCheckResult || [];

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
}

module.exports = NamecheapService;
