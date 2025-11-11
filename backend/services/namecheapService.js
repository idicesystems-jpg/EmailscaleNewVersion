// services/namecheapService.js
const axios = require("axios");
const xml2js = require("xml2js");
const NodeCache = require("node-cache");
require("dotenv").config();

const cache = new NodeCache({ stdTTL: 60 * 60 }); // 1 hour cache

const NAMECHEAP_API_URL = process.env.NAMECHEAP_ENDPOINT || "https://api.namecheap.com/xml.response";
const NAMECHEAP_API_USER = process.env.NAMECHEAP_API_USER;
const NAMECHEAP_API_KEY = process.env.NAMECHEAP_API_KEY;
const NAMECHEAP_USERNAME = process.env.NAMECHEAP_USERNAME;
let NAMECHEAP_CLIENT_IP = process.env.NAMECHEAP_CLIENT_IP; // we might update it dynamically

/**
 * Get current public IP
 */
async function getPublicIP() {
  try {
    const res = await axios.get("https://api.ipify.org?format=json");
    return res.data.ip;
  } catch (err) {
    console.error("[NamecheapService] Failed to get public IP:", err.message);
    return null;
  }
}

/**
 * Convert XML to JSON safely
 */
async function parseXmlResponse(xml) {
  const text = typeof xml === "string" ? xml.trim().replace(/^\uFEFF/, "") : "";
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  return parser.parseStringPromise(text);
}

/**
 * Core function to call Namecheap API
 */
async function callNamecheapApi(command, params = {}) {
  // Check current public IP
  const currentIP = await getPublicIP();
  if (!currentIP) throw new Error("Unable to get current public IP");

  if (NAMECHEAP_CLIENT_IP !== currentIP) {
    console.warn(
      `[NamecheapService] Warning: .env IP (${NAMECHEAP_CLIENT_IP}) differs from current IP (${currentIP})`
    );
    // Optionally, auto-update the variable
    NAMECHEAP_CLIENT_IP = currentIP;
  }

  const queryParams = {
    ApiUser: NAMECHEAP_API_USER,
    ApiKey: NAMECHEAP_API_KEY,
    UserName: NAMECHEAP_USERNAME,
    ClientIp: NAMECHEAP_CLIENT_IP,
    Command: command,
    ...params,
  };

  const url = new URL(NAMECHEAP_API_URL);
  for (const [k, v] of Object.entries(queryParams)) {
    if (v === undefined || v === null) continue;
    url.searchParams.append(k, String(v));
  }

  const cacheKey = url.href;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log("[NamecheapService] Request URL:", url.href);

    const response = await axios.get(url.href, { timeout: 30_000 });
    console.log("[NamecheapService] Raw API Response:", response.data);

    const parsed = await parseXmlResponse(response.data);

    const apiResp = parsed?.ApiResponse;
    if (apiResp?.Errors) {
      let errs = apiResp.Errors.Error;
      console.error("[NamecheapService] API Error:", errs);
      cache.set(cacheKey, parsed);
      return parsed;
    }

    cache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error("[NamecheapService] Axios error:", error.message);

    if (error.response && error.response.data) {
      try {
        const parsed = await parseXmlResponse(error.response.data);
        console.error("[NamecheapService] Parsed error response:", parsed);
        return parsed;
      } catch (e) {
        console.error("[NamecheapService] Failed to parse error response");
      }
    }

    throw new Error("Failed to call Namecheap API");
  }
}

/**
 * Check domain availability
 */
async function searchDomains(domains) {
  if (!Array.isArray(domains)) throw new Error("domains must be an array");
  const domainList = domains.join(",");
  return await callNamecheapApi("namecheap.domains.check", { DomainList: domainList });
}

/**
 * Search alternate domains
 */
async function searchAlternateDomains(domainName, count = 10) {
  return await callNamecheapApi("namecheap.domains.suggest", {
    Domain: domainName,
    MaxResults: count,
  });
}

module.exports = {
  searchDomains,
  searchAlternateDomains,
  callNamecheapApi,
};
