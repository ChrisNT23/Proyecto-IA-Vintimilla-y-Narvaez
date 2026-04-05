import { apiSlice } from "./apiSlice";

export const multimodalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMultimodalAnalysis: builder.mutation({
      query: ({ data, mode = 'rules' }) => ({
        url: `/api/multimodal/multimodal-integration?mode=${mode}`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetMultimodalAnalysisMutation,
} = multimodalApiSlice;
