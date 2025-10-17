import { apiSlice } from "./apiSlice";

export const emailWarmupService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch email warmup list
    fetchEmailWarmup: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page);
        if (params?.limit) queryParams.append("limit", params.limit);
        if (params?.search) queryParams.append("search", params.search);
        return `email-warmup?${queryParams.toString()}`;
      },
      providesTags: ["EmailWarmup"],
    }),

    // Delete single warmup email
    deleteWarmupEmail: builder.mutation({
      query: (id) => ({
        url: `email-warmup/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmailWarmup"],
    }),

    // Bulk delete warmup emails
    bulkDeleteWarmupEmail: builder.mutation({
      query: (ids) => ({
        url: "bulk-delete-warmup-email",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: ["EmailWarmup"],
    }),

    // Export warmup emails as CSV
    exportWarmupCsv: builder.query({
      query: () => ({
        url: "export-email-warmup-csv",
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "email-warmup.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        },
      }),
    }),

    // Fetch email provider counts
    fetchEmailProviderCounts: builder.query({
      query: () => "email-provider-counts",
      providesTags: ["EmailWarmupCounts"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchEmailWarmupQuery,
  useDeleteWarmupEmailMutation,
  useBulkDeleteWarmupEmailMutation,
  useExportWarmupCsvQuery,
  useFetchEmailProviderCountsQuery,
} = emailWarmupService;
