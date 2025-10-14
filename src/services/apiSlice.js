import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://your-backend-url.com/api/", // 👈 Replace with your backend API base URL
  }),
  endpoints: () => ({}),
});
