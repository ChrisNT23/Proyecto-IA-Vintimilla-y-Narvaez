// src/slices/treatmentApiSlice.js

import { apiSlice } from './apiSlice';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const treatmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // **Asignaciones Endpoints**
    getAssignedActivities: builder.query({
      query: (treatmentId) => `/api/treatments/${treatmentId}/assignedActivities`, // Asegúrate de que esta ruta existe en el backend
      providesTags: (result, error, treatmentId) => [
        { type: 'AssignedActivities', id: treatmentId },
      ],
    }),
    getAssignedActivities2: builder.query({
      query: ({ treatmentId, patientId }) => `/api/treatments/${treatmentId}/assignedActivities2/${patientId}`,
      providesTags: (result, error, { treatmentId, patientId }) => [
        { type: 'AssignedActivities', id: treatmentId },
        { type: 'PatientActivities', id: patientId },
      ],
    }),
    assignActivityToPatient: builder.mutation({
      query: ({ patientId, doctorId, activityId }) => ({
        url: '/api/assignments',
        method: 'POST',
        body: { patientId, doctorId, activityId },
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: 'AssignedActivities', id: patientId },
      ],
    }),
    deleteAssignedActivity: builder.mutation({
      query: ({ assignmentId }) => ({
        url: `/api/assignments/${assignmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: 'AssignedActivities', id: patientId },
      ],
    }),    
    getMyAssignedActivities: builder.query({
      query: () => '/api/assignments/myactivities',
      providesTags: ['AssignedActivities'],
    }),

    // **Tratamientos Endpoints**
    createTreatment: builder.mutation({
      query: (treatmentData) => ({
        url: '/api/treatments/create',
        method: 'POST',
        body: treatmentData,
      }),
      invalidatesTags: ['Treatments'],
    }),
    getMyTreatments: builder.query({
      query: () => '/api/treatments/mytreatments',
      providesTags: ['Treatments'],
    }),
    getTreatmentById: builder.query({
      query: (treatmentId) => `/api/treatments/${treatmentId}`,
      providesTags: (result, error, treatmentId) => [{ type: 'Treatment', id: treatmentId }],
    }), 
    updateTreatment: builder.mutation({
      query: ({ treatmentId, updatedData }) => ({
        url: `/api/treatments/${treatmentId}`,
        method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: (result, error, { treatmentId }) => [
        { type: 'Treatment', id: treatmentId },
        'Treatments',
      ],
    }),
    getActivitiesByUser: builder.query({ // Nueva query
      query: () => `/api/treatments/activities`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Activities', id: _id })),
              { type: 'Activities', id: 'LIST' },
            ]
          : [{ type: 'Activities', id: 'LIST' }],
    }),

    // **Medicamentos Endpoints**
    getMyMedications: builder.query({
      query: () => '/api/treatments/my-medications',
      providesTags: ['Medications'],
    }), 
    /*]getDueMedications: builder.query({
      query: () => '/api/treatments/due-medications',
      providesTags: ['Medications'],
    }),*/
    getTreatmentsByPatient: builder.query({
      query: (patientId) => `/api/treatments/patient/${patientId}/treatments`,
    }),

    // **Nuevos Endpoints para Actividades Completadas**
    recordActivity: builder.mutation({
      query: ({ treatmentId, activityData }) => ({
        url: `/api/treatments/${treatmentId}/activities`,
        method: 'POST',
        body: activityData,
      }),
      invalidatesTags: (result, error, { treatmentId }) => [
        { type: 'Treatment', id: treatmentId },
        { type: 'CompletedActivities', id: treatmentId },
      ],
    }),
    getCompletedActivities: builder.query({
      query: (treatmentId) => `/api/treatments/${treatmentId}/activities`,
      providesTags: (result, error, treatmentId) => [
        { type: 'CompletedActivities', id: treatmentId },
      ],
    }),
    getActiveTreatment: builder.query({
      query: (userId) => `/api/treatments/${userId}/active-treatment`,
      providesTags: (result, error, userId) => [{ type: 'Treatments', id: userId }],
    }),
    getActiveTreatment2: builder.query({
      query: (patientId) => `/api/treatments/${patientId}/active-treatment2`,
      providesTags: (result, error, patientId) => [
        { type: 'ActiveTreatment', id: patientId },
      ],
    }),
    toggleActivateTreatment: builder.mutation({
      query: ({ treatmentId, active }) => ({
        url: `/api/treatments/${treatmentId}/activate`,
        method: 'PATCH',
        body: { active },
      }),
      invalidatesTags: (result, error, { treatmentId }) => [
        { type: 'Treatment', id: treatmentId },
        'Treatments',
      ],
    }),
    getCompletedActivitiesByTreatment: builder.query({
      query: (treatmentId) => `/api/treatments/${treatmentId}/completedActivities`,
      providesTags: (result, error, treatmentId) => [
        { type: 'CompletedActivities', id: treatmentId },
      ],
    }),
    /*takeMedication: builder.mutation({
      query: ({ treatmentId, medicationId }) => ({
        url: `/api/treatments/${treatmentId}/medications/${medicationId}/take`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { treatmentId }) => [
        { type: 'Medications', id: treatmentId },
        { type: 'Treatments', id: treatmentId },
      ],
    }),*/
    getTreatmentsByPatient2: builder.query({
      query: (patientId) => `/api/treatments/patient/${patientId}/treatments2`,
      providesTags: (result, error, patientId) => [
        { type: 'TreatmentsByPatient', id: patientId },
      ],
    }),
    getTreatmentsByMultiplePatients: builder.mutation({
      query: ({ patientIds }) => ({
        url: '/api/treatments/patients/treatments',
        method: 'POST',
        body: { patientIds },
      }),
      invalidatesTags: ['TreatmentsByPatient'],
    }),
    getDueMedications: builder.query({
      query: (treatmentId) => `/api/treatments/${treatmentId}/medications/due`,
      providesTags: (result, error, treatmentId) => [
        { type: 'Medications', id: treatmentId },
      ],
    }),

    // Marcar un medicamento como tomado
    takeMedication: builder.mutation({
      query: ({ treatmentId, medicationId }) => ({
        url: `/api/treatments/${treatmentId}/medications/${medicationId}/take`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { treatmentId }) => [
        { type: 'Medications', id: treatmentId },
      ],
    }),
  }),
});

export const {
  // **Asignaciones Hooks**
  useGetActivitiesQuery,
  useGetAssignedActivitiesQuery,
  useGetAssignedActivities2Query,
  useAssignActivityToPatientMutation,
  useDeleteAssignedActivityMutation,
  useGetMyAssignedActivitiesQuery,

  // **Tratamientos Hooks**
  useCreateTreatmentMutation,
  useGetMyTreatmentsQuery,
  useGetTreatmentByIdQuery,
  useUpdateTreatmentMutation,
  useGetTreatmentsByPatientQuery,
  useGetActivitiesByUserQuery,
  useGetTreatmentsByPatient2Query,
  useGetTreatmentsByMultiplePatientsMutation,
  useGetActiveTreatment2Query,

  // **Medicamentos Hooks**
  useGetMyMedicationsQuery,
  useGetDueMedicationsQuery,
  useTakeMedicationMutation,

  // **Nuevos Hooks para Actividades Completadas**
  useRecordActivityMutation,
  useGetCompletedActivitiesQuery,
  useGetActiveTreatmentQuery,
  useToggleActivateTreatmentMutation,
  useGetCompletedActivitiesByTreatmentQuery,
  /*useTakeMedicationMutation*/
} = treatmentApiSlice;
