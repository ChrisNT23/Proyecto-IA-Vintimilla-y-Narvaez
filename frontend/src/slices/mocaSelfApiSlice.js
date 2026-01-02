// src/slices/mocaSelfApiSlice.js

import { apiSlice } from "./apiSlice";

export const mocaSelfApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Crear un registro MocaSelf
    createMocaSelf: builder.mutation({
      query: (mocaData) => ({
        url: "/api/mocaSelf",
        method: "POST",
        body: mocaData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "MocaSelf", id: "LIST" },
      ],
    }),

    // Obtener todos los MocaSelf (filtrado por patientId)
    getAllMocaSelfs: builder.query({
      query: (patientId) => {
        let url = "/api/mocaSelf";
        if (patientId) {
          url += `?patientId=${patientId}`;
        }
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              { type: "MocaSelf", id: "LIST" },
              ...result.map(({ _id }) => ({ type: "MocaSelf", id: _id })),
            ]
          : [{ type: "MocaSelf", id: "LIST" }],
    }),

    // Obtener un MocaSelf por ID
    getMocaSelfById: builder.query({
      query: (id) => `/api/mocaSelf/${id}`,
      providesTags: (result, error, id) => [{ type: "MocaSelf", id }],
    }),

    // Actualizar un registro MocaSelf
    updateMocaSelf: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/mocaSelf/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [{ type: "MocaSelf", id: arg.id }],
    }),

    // Eliminar un registro MocaSelf
    deleteMocaSelf: builder.mutation({
      query: (id) => ({
        url: `/api/mocaSelf/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "MocaSelf", id },
        { type: "MocaSelf", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateMocaSelfMutation,
  useGetAllMocaSelfsQuery,
  useGetMocaSelfByIdQuery,
  useUpdateMocaSelfMutation,
  useDeleteMocaSelfMutation,
} = mocaSelfApiSlice;
