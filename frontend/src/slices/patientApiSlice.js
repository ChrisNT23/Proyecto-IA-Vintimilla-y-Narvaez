// frontend/src/slices/patientApiSlice.js

import { apiSlice } from "./apiSlice";

export const patientApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query({
      query: () => "/api/patients",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Patient', id: _id })),
              { type: 'Patient', id: 'LIST' },
            ]
          : [{ type: 'Patient', id: 'LIST' }],
    }),
    getPatientById: builder.query({
      query: (id) => `/api/patients/${id}`,
      providesTags: (result, error, id) => [{ type: "Patient", id }],
    }),
    getMyPatient: builder.query({
      query: () => "/api/patients/me",
      providesTags: (result, error, id) => [{ type: "Patient", id: result?._id }],
    }),
    updatePatient: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/api/patients/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Patient", id }],
    }),
    updateMyPatient: builder.mutation({
      query: (patch) => ({
        url: "/api/patients/me",
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: [{ type: "Patient", id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useGetPatientByIdQuery,
  useGetMyPatientQuery,
  useUpdatePatientMutation,
  useUpdateMyPatientMutation,
} = patientApiSlice;
