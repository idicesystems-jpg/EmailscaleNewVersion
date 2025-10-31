import { apiSlice } from "./apiSlice";

export const adminUserService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all users
    fetchUsers: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.search) queryParams.append("search", params.search);

        return `users?${queryParams.toString()}`;
      },
      providesTags: ["Users"],
    }),

    // New allUsers endpoint
    allUsers: builder.query({
      query: () => "all-users",
      providesTags: ["Users"],
    }),

    getAdminList: builder.query({
      query: () => "admins",
      providesTags: ["Admins"],
    }),

    exportUsersCsv: builder.query({
      query: () => ({
        url: "export-csv",
        method: "GET",
        responseHandler: async (response) => {
          // Get the raw blob
          const blob = await response.blob();
          // Create a temporary download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "users.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        },
      }),
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
        url: `delete-user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    updateUser: builder.mutation({
      query: ({ userId, ...userData }) => ({
        url: `updateUserFormData/${userId}/update`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    updateUserStatus: builder.mutation({
      query: ({ userId, status }) => ({
        url: `update-status/${userId}`, // 👈 your backend route
        method: "PUT", // or PATCH if your backend uses that
        body: { status },
      }),
      invalidatesTags: ["Users"], // ✅ ensures user list refreshes after update
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

    adminChangeUserPassword: builder.mutation({
      query: (passwordData) => ({
        url: "admin/change-password",
        method: "POST",
        body: passwordData,
      }),
      invalidatesTags: ["Users"],
    }),

    updateUserRole: builder.mutation({
      query: ({ id, role_id }) => ({
        url: `users/${id}/role`,
        method: "PUT",
        body: { role_id },
      }),
      invalidatesTags: ["Users"], // optional: refresh user list if you have it
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
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useLazyExportUsersCsvQuery,
  useAllUsersQuery,
  useGetAdminListQuery,
  useUpdateUserRoleMutation,
  useAdminChangeUserPasswordMutation,
} = adminUserService;
