import useSWR from 'swr';
import type { Thread } from '@ocha/types';
import { useAuth } from './useAuth';

interface ThreadsResponse {
  threads: Thread[];
}

const fetcher = async (url: string, headers: Record<string, string>) => {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch threads');
  }
  return response.json();
};

export function useThreads() {
  const { user, getAuthHeaders } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<ThreadsResponse>(
    user ? ['/api/threads', getAuthHeaders()] : null,
    ([url, headers]: [string, Record<string, string>]) => fetcher(url, headers),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const createThread = async (): Promise<string> => {
    const response = await fetch("/api/threads", {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const responseData = await response.json();
    if (response.ok) {
      // Revalidate threads after creation
      mutate();
      return responseData.thread.id;
    }
    throw new Error(responseData.error || "Failed to create thread");
  };

  return {
    threads: data?.threads || [],
    error,
    isLoading,
    createThread,
    mutate,
  };
}