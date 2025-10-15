import { apiSlice } from "./apiSlice";

export const adminUserService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all users
    fetchUsers: builder.query({
      query: () => "users",
      providesTags: ["Users"],
    }),

    // Create a new user
    createUser: builder.mutation({
      query: (userData) => ({
        url: "add-user",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    // Delete user
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `users/delete/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

     updateUser: builder.mutation({
      query: ({ userId, ...userData }) => ({
        url: `update-user/${userId}`,
        method: "PUT", // or PUT if your backend expects that
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    // Toggle account lock
    toggleLock: builder.mutation({
      query: ({ userId, lock }) => ({
        url: `users/lock/${userId}`,
        method: "PATCH",
        body: { lock },
      }),
      invalidatesTags: ["Users"],
    }),

    // Toggle account pause
    togglePause: builder.mutation({
      query: ({ userId, pause }) => ({
        url: `users/pause/${userId}`,
        method: "PATCH",
        body: { pause },
      }),
      invalidatesTags: ["Users"],
    }),

    // Change user password
    changePassword: builder.mutation({
      query: ({ userId, password }) => ({
        url: `users/change-password/${userId}`,
        method: "PATCH",
        body: { password },
      }),
    }),

    // Update subscription plan
    updateSubscription: builder.mutation({
      query: ({ userId, plan }) => ({
        url: `users/subscription/${userId}`,
        method: "PATCH",
        body: { plan },
      }),
      invalidatesTags: ["Users"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useToggleLockMutation,
  useTogglePauseMutation,
  useChangePasswordMutation,
  useUpdateSubscriptionMutation,
  useUpdateUserMutation
} = adminUserService;
