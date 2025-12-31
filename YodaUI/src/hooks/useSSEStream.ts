import { useEffect, useRef, useState } from 'react';

export interface StreamEvent {
  type: 'status' | 'response' | 'error' | 'complete';
  data: string;
}

interface UseSSEStreamOptions {
  onEvent: (event: StreamEvent) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export const useSSEStream = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = (url: string, options: UseSSEStreamOptions) => {
    setIsStreaming(true);

    try {
      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.addEventListener('status', (event) => {
        const data = event.data as string;
        options.onEvent({
          type: 'status',
          data,
        });
      });

      eventSourceRef.current.addEventListener('response', (event) => {
        const data = event.data as string;
        options.onEvent({
          type: 'response',
          data,
        });
      });

      eventSourceRef.current.addEventListener('complete', () => {
        options.onEvent({
          type: 'complete',
          data: '',
        });
        closeStream();
        setIsStreaming(false);
        options.onComplete();
      });

      eventSourceRef.current.addEventListener('error', () => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          closeStream();
          setIsStreaming(false);
        } else {
          const error = new Error('Stream connection error');
          options.onError(error);
          closeStream();
          setIsStreaming(false);
        }
      });
    } catch (error) {
      options.onError(error instanceof Error ? error : new Error('Stream error'));
      setIsStreaming(false);
    }
  };

  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      closeStream();
    };
  }, []);

  return {
    startStream,
    closeStream,
    isStreaming,
  };
};
