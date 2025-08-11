import useSWR from 'swr';
import type { Thread } from '@ocha/types';
import { useAuth } from './useAuth';
import { client, getAuthHeaders } from '../lib/api';

interface ThreadsResponse {
  threads: Thread[];
}

const fetcher = async () => {
  const response = await client.api.threads.$get({
    header: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch threads');
  }
  return response.json();
};

export function useThreads() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<ThreadsResponse>(
    user ? 'threads' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const createThread = async (): Promise<string> => {
    const response = await client.api.threads.$post(
      {
        json: { title: undefined },
      },
      {
        headers: getAuthHeaders(),
      }
    );
    const responseData = await response.json();
    
    if (response.ok) {
      // Type guard to check if response has thread property
      if ("thread" in responseData && responseData.thread) {
        // Revalidate threads after creation
        mutate();
        return responseData.thread.id;
      }
      throw new Error("Invalid response: missing thread data");
    }
    const errorMsg = "error" in responseData ? responseData.error : "Failed to create thread";
    throw new Error(errorMsg);
  };

  return {
    threads: data?.threads || [],
    error,
    isLoading,
    createThread,
    mutate,
  };
}