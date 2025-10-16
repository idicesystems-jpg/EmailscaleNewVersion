import { apiSlice } from "./apiSlice";

export const adminDomainService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all domains
    fetchDomains: builder.query({
      query: () => "domains",
      providesTags: ["Domains"],
    }),

    // Create a new domain (with optional user creation)
    createDomain: builder.mutation({
      query: (domainData) => ({
        url: "add-domain",
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
        url: `delete-domain/${domainId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Domains"],
    }),

    // Export domains as CSV
    exportDomainsCsv: builder.query({
      query: () => ({
        url: "export-domains",
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "domains.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        },
      }),
    }),

    // Update domain status (Active / Inactive)
    updateDomainStatus: builder.mutation({
      query: ({ domainId, status }) => ({
        url: `update-domain-status/${domainId}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Domains"],
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
} = adminDomainService;
