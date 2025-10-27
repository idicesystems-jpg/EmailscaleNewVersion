import { apiSlice } from "./apiSlice";

export const authService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: "login",
        method: "POST",
        body: credentials,
      }),
    }),

    registerUser: builder.mutation({
      query: (newUser) => ({
        url: "auth/register",
        method: "POST",
        body: newUser,
      }),
    }),

    getUserProfile: builder.query({
      query: (token) => ({
        url: "auth/profile",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    }),

    updateUser: builder.mutation({
      query: ({ profile }) => ({
        url: "update-user",
        method: "POST",
        body: profile,
      }),
    }),

    changePassword: builder.mutation({
      query: ({ passwordData }) => ({
        url: "change-password",
        method: "POST",
        body: passwordData,
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useLoginUserMutation,
  useRegisterUserMutation,
  useGetUserProfileQuery,
  useUpdateUserMutation,
  useChangePasswordMutation,
} = authService;
