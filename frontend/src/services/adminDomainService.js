import { apiSlice } from "./apiSlice";

export const adminDomainService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all domains
    fetchDomains: builder.query({
      query: () => "all-domains",
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
  useImportDomainsMutation 
} = adminDomainService;
