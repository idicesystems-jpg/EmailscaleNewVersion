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

    deleteEmailAccounts: builder.mutation({
      query: (id) => ({
        url: `delete-email-accounts/${id}`,
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
    exportWarmupCsv: builder.mutation({
      query: () => ({
        url: "export-email-warmup-csv",
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    exportEmailAccountsCsv: builder.mutation({
      query: () => ({
        url: "export-email-accounts",
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    // Fetch email provider counts
    fetchEmailProviderCounts: builder.query({
      query: () => "email-provider-counts",
      providesTags: ["EmailWarmupCounts"],
    }),

    saveEmailNew: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "save-email-new",
          method: "POST",
          body: formData,
        };
      },
    }),

    addProvider: builder.mutation({
      query: (body) => ({
        url: "add_provider",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProviderAccounts"],
    }),

    addSmtpAccount: builder.mutation({
      query: (body) => ({
        url: "smtps",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SmtpAccounts"],
    }),

    getAllSmtpAccounts: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page);
        if (params?.limit) queryParams.append("limit", params.limit);
        if (params?.search) queryParams.append("search", params.search);
        return `smtps?${queryParams.toString()}`;
      },
      providesTags: ["SmtpAccounts"],
    }),

    getProviders: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page);
        if (params?.limit) queryParams.append("limit", params.limit);
        if (params?.search) queryParams.append("search", params.search);
        return `providers?${queryParams.toString()}`;
      },
      providesTags: ["Providers"],
    }),

    getWarmupLogs: builder.query({
      query: () => ({
        url: "warmup-logs",
        method: "GET",
      }),
      providesTags: ["WarmupLogs"],
    }),


  }),
  overrideExisting: false,
});

export const {
  useFetchEmailWarmupQuery,
  useDeleteWarmupEmailMutation,
  useDeleteEmailAccountsMutation,
  useBulkDeleteWarmupEmailMutation,
  useExportWarmupCsvMutation,
  useFetchEmailProviderCountsQuery,
  useSaveEmailNewMutation,
  useExportEmailAccountsCsvMutation,
  useAddProviderMutation,
  useAddSmtpAccountMutation,
  useGetAllSmtpAccountsQuery,
  useGetProvidersQuery,
  useGetWarmupLogsQuery 
} = emailWarmupService;
