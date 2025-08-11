import useSWR from 'swr';
import type { Message } from '@ocha/types';
import { useAuth } from './useAuth';

interface ThreadHistoryResponse {
  messages: Message[];
}

const fetcher = async (url: string, headers: Record<string, string>) => {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch thread history');
  }
  return response.json();
};

export function useThreadHistory(threadId: string | null) {
  const { user, getAuthHeaders } = useAuth();
  
  const { data, error, isLoading } = useSWR<ThreadHistoryResponse>(
    user && threadId ? [`/api/threads/${threadId}`, getAuthHeaders()] : null,
    ([url, headers]: [string, Record<string, string>]) => fetcher(url, headers),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    messages: data?.messages || [],
    error,
    isLoading,
  };
}