import { apiSlice } from "./apiSlice";

export const userEmailWarmupService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listEmailCampaigns: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.user_id) queryParams.append("user_id", params.user_id);
        if (params.q) queryParams.append("q", params.q);
        if (params.p) queryParams.append("p", params.p);
        if (params.perPage) queryParams.append("perPage", params.perPage);
        if (params.sortKey) queryParams.append("sortKey", params.sortKey);
        if (params.sortDirection)
          queryParams.append("sortDirection", params.sortDirection);

        return {
          url: `list-email-campaigns?${queryParams.toString()}`,
          method: "POST",
        };
      },
      providesTags: ["EmailCampaigns"],
    }),

    addSingleEmailCampaign: builder.mutation({
      query: (data) => ({
        url: "single-email-campaign",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["EmailCampaigns"],
    }),

    getAllEmailCampaigns: builder.query({
  query: (params) => ({
    url: "get-all-email-campaigns",
    method: "POST",
    body: params,
  }),
  providesTags: ["EmailCampaigns"],
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
  }),
  overrideExisting: false,
});

export const {
  useListEmailCampaignsQuery,
  useAddSingleEmailCampaignMutation,
  useGetAllEmailCampaignsQuery,

  

  useDeleteWarmupEmailMutation,
  useDeleteEmailAccountsMutation,
  useBulkDeleteWarmupEmailMutation,
  useExportWarmupCsvMutation,
  useFetchEmailProviderCountsQuery,
  useSaveEmailNewMutation,
  useExportEmailAccountsCsvMutation,
} = userEmailWarmupService;
