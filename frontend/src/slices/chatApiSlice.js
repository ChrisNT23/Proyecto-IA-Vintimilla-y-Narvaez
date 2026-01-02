import { apiSlice } from "./apiSlice";

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query({
      query: () => "/api/chats",
      providesTags: ["Chat"],
    }),
    sendMessage: builder.mutation({
      query: ({ chatId, content }) => ({
        url: `/api/chats/${chatId}/send`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Chat", "Message"],
    }),
    createChat: builder.mutation({
      query: ({ participantId }) => ({
        url: `/api/chats`,
        method: "POST",
        body: { participantId },
      }),
      invalidatesTags: ["Chat"],
    }),
    getMessages: builder.query({
      query: (chatId) => `/api/chats/${chatId}/messages`,
      providesTags: ["Message"],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useSendMessageMutation,
  useCreateChatMutation,
  useGetMessagesQuery, // Asegúrate de exportarlo aquí
} = chatApiSlice;
