// frontend/src/slices/moodApiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const moodApi = createApi({
  reducerPath: 'moodApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/users', 
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getMoodsByDate: builder.query({
      query: (date) => `moods?date=${date}`, // Endpoint para obtener moods por fecha
    }),
  }),
});

export const { useGetMoodsByDateQuery } = moodApi;
