
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "../services/authSlice";


const API_URL = import.meta.env.VITE_API_URL;

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: () => ({}),
});
