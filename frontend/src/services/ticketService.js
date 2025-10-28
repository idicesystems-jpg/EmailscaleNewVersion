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

    rateTicket: builder.mutation({
      query: ({ id, rating, feedback }) => ({
        url: `rate/${id}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, feedback }),
      }),
      invalidatesTags: ["Tickets"],
    }),

    // Get all tickets (admin)
    getAllTickets: builder.query({
      query: ({ page = 1, limit = 10, status, priority }) => {
        const queryParams = new URLSearchParams();

        queryParams.append("page", page);
        queryParams.append("limit", limit);

        if (status) queryParams.append("status", status);
        if (priority) queryParams.append("priority", priority);

        return `all-tickets?${queryParams.toString()}`;
      },
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
      query: ({ page = 1, limit = 10, status, priority }) => {
        const queryParams = new URLSearchParams();

        queryParams.append("page", page);
        queryParams.append("limit", limit);

        if (status) queryParams.append("status", status);
        if (priority) queryParams.append("priority", priority);

        return `user-tickets?${queryParams.toString()}`;
      },
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

    deleteNote: builder.mutation({
      query: (noteId) => ({
        url: `Notedelete/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tickets"],
    }),

    notificationsUnreadCount: builder.query({
      query: (email) => ({
        url: `notifications/unread-count/${email}`,
        method: "GET",
      }),
    }),

    notificationsByEmail: builder.query({
      query: (email) => ({
        url: `notifications/${email}`,
        method: "GET",
      }),
    }),

    markNotificationsRead: builder.mutation({
      query: (email) => ({
        url: `notifications/mark-read/${email}`,
        method: "POST",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateTicketMutation,
  useGetAllTicketsQuery,
  useLazyGetTicketDetailByIdQuery,
  useReplyTicketMutation,
  useLazyGetRepliesQuery,
  useGetUserTicketsQuery,
  useCloseTicketMutation,
  useLazyGetAllNotesByTicketIdQuery,
  useAddTicketNoteMutation,
  useDeleteNoteMutation,
  useRateTicketMutation,
  useNotificationsUnreadCountQuery,
  useNotificationsByEmailQuery,
  useMarkNotificationsReadMutation,
} = ticketService;
