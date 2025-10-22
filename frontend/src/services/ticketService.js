import { apiSlice } from "./apiSlice";

export const ticketService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new support ticket
    createTicket: builder.mutation({
      query: (formData) => ({
        url: "create-ticket",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Tickets"],
    }),

    // Get all tickets (admin)
    getAllTickets: builder.query({
      query: () => "all-tickets",
      providesTags: ["Tickets"],
    }),

    getAllNotesByTicketId: builder.query({
      query: (ticketId) => `all-notes/${ticketId}`,
      providesTags: ["Notes"],
    }),

    addTicketNote: builder.mutation({
      query: ({ ticketId, note }) => ({
        url: `ticket-notes/${ticketId}`,
        method: "POST",
        body: { note },
      }),
      invalidatesTags: ["TicketNotes"],
    }),

    // Get ticket detail by ID
    getTicketDetailById: builder.query({
      query: (id) => `getTicketDetailById/${id}`,
      providesTags: ["Tickets"],
    }),

    // Reply to a ticket
    replyTicket: builder.mutation({
      query: (formData) => ({
        url: "reply",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Tickets"],
    }),

    // Get all replies for a specific ticket
    getReplies: builder.query({
      query: (id) => `replies/${id}`,
      providesTags: ["Replies"],
    }),

    // Get all tickets of logged-in user
    getUserTickets: builder.query({
      query: () => "user-tickets",
      providesTags: ["Tickets"],
    }),

    // Close a ticket
    closeTicket: builder.mutation({
      query: (id) => ({
        url: `close/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["Tickets"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateTicketMutation,
  useGetAllTicketsQuery,
  useGetTicketDetailByIdQuery,
  useReplyTicketMutation,
  useGetRepliesQuery,
  useGetUserTicketsQuery,
  useCloseTicketMutation,
  useGetAllNotesByTicketIdQuery,
  useAddTicketNoteMutation
} = ticketService;
