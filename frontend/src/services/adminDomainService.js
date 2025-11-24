import { apiSlice } from "./apiSlice";

export const adminDomainService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all domains
    fetchDomains: builder.query({
      // params: { page?: number, limit?: number, search?: string }
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);

        return `all-domains?${queryParams.toString()}`;
      },
      providesTags: ["Domains"],
    }),

    // Create a new domain (with optional user creation)
    createDomain: builder.mutation({
      query: (domainData) => ({
        url: "save-domain",
        method: "POST",
        body: domainData,
      }),
      invalidatesTags: ["Domains"],
    }),

    // Update existing domain
    updateDomain: builder.mutation({
      query: ({ domainId, ...domainData }) => ({
        url: `update-domain/${domainId}`,
        method: "PUT",
        body: domainData,
      }),
      invalidatesTags: ["Domains"],
    }),

    // Delete a domain
    deleteDomain: builder.mutation({
      query: (domainId) => ({
        url: `domains/${domainId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Domains"],
    }),

    // Export domains as CSV
    exportDomainsCsv: builder.query({
      query: (params) => {
        // params can be { ids: [1,2,3] } or {}
        const selected_ids = params?.selected_ids || []; // fallback to empty array
        const queryString =
          selected_ids.length > 0
            ? `?selected_ids=${selected_ids.join(",")}`
            : "";
        return {
          url: `export-domains${queryString}`,
          method: "GET",
          responseHandler: (response) => response.blob(),
        };
      },
    }),

    importDomains: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("import_file", file);

        return {
          url: "import-domains",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Domains"], // optionally refresh the list after import
    }),

    // Update domain status (Active / Inactive)
    updateDomainStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `domains/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Domains"],
    }),

    checkAlternateDomainAvailability: builder.mutation({
      query: (payload) => ({
        url: "checkAlternateDomainAvailability",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Domains"],
    }),

    createPaymentIntent: builder.mutation({
      query: (payload) => ({
        url: "create-payment-intent",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Payment"],
    }),


  }),
  overrideExisting: false,
});

export const {
  useFetchDomainsQuery,
  useCreateDomainMutation,
  useUpdateDomainMutation,
  useDeleteDomainMutation,
  useUpdateDomainStatusMutation,
  useLazyExportDomainsCsvQuery,
  useImportDomainsMutation,
  useCheckAlternateDomainAvailabilityMutation,
  useCreatePaymentIntentMutation
} = adminDomainService;
