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
    addAdminNoteReply: builder.mutation({
  query: (replyData) => ({
    url: "admin-note-replies",
    method: "POST",
    body: replyData,
  }),
  invalidatesTags: ["AdminNotes"],
}),

deleteNoteWithReplies: builder.mutation({
  query: (id) => ({
    url: `delete-notes/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: ["AdminNotes"],
}),

reassignNote: builder.mutation({
  query: ({ id, ...updateData }) => ({
    url: `reassign-note/${id}`,
    method: "PUT",
    body: updateData,
  }),
  invalidatesTags: ["AdminNotes"],
}),


deleteNoteReply: builder.mutation({
  query: (id) => ({
    url: `delete-note-reply/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: ["AdminNotes"],
}),



  }),
  overrideExisting: false,
});

export const {
  useAddAdminNoteMutation,
  useGetAdminNotesQuery,
  useAddAdminNoteReplyMutation,
  useDeleteNoteWithRepliesMutation,
  useReassignNoteMutation ,
  useDeleteNoteReplyMutation
} = adminNoteService;
