import { apiSlice } from "./apiSlice";

export const adminNoteService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Add a new admin note
    addAdminNote: builder.mutation({
      query: (noteData) => ({
        url: "add-admin-notes",
        method: "POST",
        body: noteData,
      }),
      invalidatesTags: ["AdminNotes"],
    }),

    // Get all admin notes
    getAdminNotes: builder.query({
      query: () => "get-admin-notes",
      providesTags: ["AdminNotes"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddAdminNoteMutation,
  useGetAdminNotesQuery,
} = adminNoteService;
