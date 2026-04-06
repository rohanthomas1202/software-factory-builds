'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Card, Column } from '@/lib/types';
import { WSMessage, WSServer } from '@/lib/ws-server';

interface UseBoardSocketProps {
  boardId: string | null;
  onCardMoved: (card: Card, previousColumnId: string) => void;
  onCardUpdated: (card: Card) => void;
  onCardCreated: (card: Card) => void;
  onCardDeleted: (cardId: string) => void;
  onColumnUpdated: (column: Column) => void;
  onColumnCreated: (column: Column) => void;
  onColumnDeleted: (columnId: string) => void;
}

export function useBoardSocket({
  boardId,
  onCardMoved,
  onCardUpdated,
  onCardCreated,
  onCardDeleted,
  onColumnUpdated,
  onColumnCreated,
  onColumnDeleted,
}: UseBoardSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!boardId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      const joinMessage: WSMessage = {
        type: 'join',
        payload: { boardId },
      };
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;

        switch (data.type) {
          case 'card.moved':
            onCardMoved(data.payload.card, data.payload.previousColumnId);
            break;
          case 'card.updated':
            onCardUpdated(data.payload.card);
            break;
          case 'card.created':
            onCardCreated(data.payload.card);
            break;
          case 'card.deleted':
            onCardDeleted(data.payload.cardId);
            break;
          case 'column.updated':
            onColumnUpdated(data.payload.column);
            break;
          case 'column.created':
            onColumnCreated(data.payload.column);
            break;
          case 'column.deleted':
            onColumnDeleted(data.payload.columnId);
            break;
          default:
            console.warn('Unhandled WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect in 3s...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [
    boardId,
    onCardMoved,
    onCardUpdated,
    onCardCreated,
    onCardDeleted,
    onColumnUpdated,
    onColumnCreated,
    onColumnDeleted,
  ]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open, message not sent:', message);
    }
  }, []);

  return { sendMessage };
}