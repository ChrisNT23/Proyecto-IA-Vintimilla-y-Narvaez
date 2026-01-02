import { ACTIVITIES_URL, UPLOAD_URL } from "../constants.js";
import { apiSlice } from "./apiSlice.js";

// Lógica de interacción con APIs para actividades
export const activitiesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getActivities: builder.query({
            query: () => ({
                url: ACTIVITIES_URL,
            }),
            providesTags: ['Activity'],
            keepUnusedDataFor: 5
        }),
        getActivitiesEvent: builder.query({
            query: () => ({
                url: ACTIVITIES_URL,
            }),
            keepUnusedDataFor: 5,
        }),
        getActivityDetails: builder.query({
            query: (activityId) => ({
                url: `${ACTIVITIES_URL}/${activityId}`,
            }),
            keepUnusedDataFor: 5,
        }),
        createActivity: builder.mutation({
            query: (data) => ({
                url: ACTIVITIES_URL,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Activity'],
        }),
        updateActivity: builder.mutation({
            query: (data) => ({
                url: `${ACTIVITIES_URL}/${data.activityId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Activity'],
        }),
        deleteActivity: builder.mutation({
            query: (activityId) => ({
                url: `${ACTIVITIES_URL}/${activityId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Activity'],
        }),
        uploadActivityImage: builder.mutation({
            query: (data) => ({
                url: `${UPLOAD_URL}`,
                method: 'POST',
                body: data,
            }),
        }),
        createReview: builder.mutation({
            query: (data) => ({
                url: `${ACTIVITIES_URL}/${data.activityId}/reviews`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Activity'],
        }),
        getActivityById: builder.query({
            query: (activityId) => `${ACTIVITIES_URL}/${activityId}`,
            providesTags: (result, error, activityId) => [{ type: 'Activities', id: activityId }],
        }),
    }),
});

export const {
    useGetActivitiesQuery,
    useGetActivitiesEventQuery,
    useGetActivityDetailsQuery,
    useCreateActivityMutation,
    useUpdateActivityMutation,
    useDeleteActivityMutation,
    useUploadActivityImageMutation,
    useCreateReviewMutation,
    useGetActivityByIdQuery
} = activitiesApiSlice;
