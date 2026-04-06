import { WebSocketServer as WSS, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { z } from 'zod';
import type { Card } from './types';

/**
 * WebSocket message schemas for type-safe communication
 */

export const JoinMessageSchema = z.object({
  type: z.literal('join'),
  boardId: z.string(),
  userId: z.string(),
});

export const CardUpdateMessageSchema = z.object({
  type: z.literal('card_update'),
  boardId: z.string(),
  card: z.object({
    id: z.string(),
    columnId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    assigneeId: z.string().nullable().optional(),
    dueDate: z.number().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    position: z.string().optional(),
    updatedAt: z.number().optional(),
  }),
  userId: z.string(),
});

export const CardMoveMessageSchema = z.object({
  type: z.literal('card_move'),
  boardId: z.string(),
  cardId: z.string(),
  fromColumnId: z.string(),
  toColumnId: z.string(),
  newPosition: z.string(),
  userId: z.string(),
});

export const CardCreateMessageSchema = z.object({
  type: z.literal('card_create'),
  boardId: z.string(),
  card: z.object({
    id: z.string(),
    columnId: z.string(),
    title: z.string(),
    description: z.string(),
    assigneeId: z.string().nullable(),
    dueDate: z.number().nullable(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    position: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
  userId: z.string(),
});

export const CardDeleteMessageSchema = z.object({
  type: z.literal('card_delete'),
  boardId: z.string(),
  cardId: z.string(),
  columnId: z.string(),
  userId: z.string(),
});

export const BroadcastMessageSchema = z.object({
  type: z.enum(['card_update', 'card_move', 'card_create', 'card_delete']),
  boardId: z.string(),
  data: z.any(),
  userId: z.string(),
});

export type WSMessage =
  | z.infer<typeof JoinMessageSchema>
  | z.infer<typeof CardUpdateMessageSchema>
  | z.infer<typeof CardMoveMessageSchema>
  | z.infer<typeof CardCreateMessageSchema>
  | z.infer<typeof CardDeleteMessageSchema>;

export type ConnectionInfo = {
  ws: WebSocket;
  userId: string;
  boardId: string | null;
  joinedAt: number;
};

export class WSServer extends EventEmitter {
  private wss: WSS;
  private connections: Map<string, ConnectionInfo> = new Map();
  private boardRooms: Map<string, Set<string>> = new Map(); // boardId -> Set<connectionId>

  constructor(wss: WSS) {
    super();
    this.wss = wss;
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const connectionId = this.generateConnectionId();
      const connection: ConnectionInfo = {
        ws,
        userId: '',
        boardId: null,
        joinedAt: Date.now(),
      };

      this.connections.set(connectionId, connection);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          ws.send(
            JSON.stringify({
              type: 'error',
              error: 'Invalid message format',
            })
          );
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(connectionId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(connectionId);
      });

      // Send initial connection ID
      ws.send(
        JSON.stringify({
          type: 'connected',
          connectionId,
        })
      );
    });
  }

  private handleMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      // Validate message type
      if (message.type === 'join') {
        const joinMessage = JoinMessageSchema.parse(message);
        this.handleJoin(connectionId, joinMessage);
      } else if (message.type === 'card_update') {
        const cardUpdateMessage = CardUpdateMessageSchema.parse(message);
        this.handleCardUpdate(connectionId, cardUpdateMessage);
      } else if (message.type === 'card_move') {
        const cardMoveMessage = CardMoveMessageSchema.parse(message);
        this.handleCardMove(connectionId, cardMoveMessage);
      } else if (message.type === 'card_create') {
        const cardCreateMessage = CardCreateMessageSchema.parse(message);
        this.handleCardCreate(connectionId, cardCreateMessage);
      } else if (message.type === 'card_delete') {
        const cardDeleteMessage = CardDeleteMessageSchema.parse(message);
        this.handleCardDelete(connectionId, cardDeleteMessage);
      } else if (message.type === 'ping') {
        connection.ws.send(JSON.stringify({ type: 'pong' }));
      } else {
        console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Invalid message:', error);
      connection.ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
        })
      );
    }
  }

  private handleJoin(connectionId: string, message: z.infer<typeof JoinMessageSchema>) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Leave previous board room
    if (connection.boardId) {
      this.leaveBoardRoom(connectionId, connection.boardId);
    }

    // Join new board room
    connection.userId = message.userId;
    connection.boardId = message.boardId;
    this.joinBoardRoom(connectionId, message.boardId);

    // Notify other users in the board
    this.broadcastToBoard(
      message.boardId,
      connectionId,
      JSON.stringify({
        type: 'user_joined',
        boardId: message.boardId,
        userId: message.userId,
        connectionId,
      })
    );

    // Send current users in the board
    const usersInBoard = this.getUsersInBoard(message.boardId);
    connection.ws.send(
      JSON.stringify({
        type: 'board_users',
        boardId: message.boardId,
        users: usersInBoard,
      })
    );
  }

  private handleCardUpdate(
    connectionId: string,
    message: z.infer<typeof CardUpdateMessageSchema>
  ) {
    this.broadcastToBoard(
      message.boardId,
      connectionId,
      JSON.stringify({
        type: 'card_update',
        boardId: message.boardId,
        card: message.card,
        userId: message.userId,
        timestamp: Date.now(),
      })
    );
  }

  private handleCardMove(
    connectionId: string,
    message: z.infer<typeof CardMoveMessageSchema>
  ) {
    this.broadcastToBoard(
      message.boardId,
      connectionId,
      JSON.stringify({
        type: 'card_move',
        boardId: message.boardId,
        cardId: message.cardId,
        fromColumnId: message.fromColumnId,
        toColumnId: message.toColumnId,
        newPosition: message.newPosition,
        userId: message.userId,
        timestamp: Date.now(),
      })
    );
  }

  private handleCardCreate(
    connectionId: string,
    message: z.infer<typeof CardCreateMessageSchema>
  ) {
    this.broadcastToBoard(
      message.boardId,
      connectionId,
      JSON.stringify({
        type: 'card_create',
        boardId: message.boardId,
        card: message.card,
        userId: message.userId,
        timestamp: Date.now(),
      })
    );
  }

  private handleCardDelete(
    connectionId: string,
    message: z.infer<typeof CardDeleteMessageSchema>
  ) {
    this.broadcastToBoard(
      message.boardId,
      connectionId,
      JSON.stringify({
        type: 'card_delete',
        boardId: message.boardId,
        cardId: message.cardId,
        columnId: message.columnId,
        userId: message.userId,
        timestamp: Date.now(),
      })
    );
  }

  private handleDisconnect(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (connection.boardId) {
      this.leaveBoardRoom(connectionId, connection.boardId);

      // Notify other users in the board
      this.broadcastToBoard(
        connection.boardId,
        connectionId,
        JSON.stringify({
          type: 'user_left',
          boardId: connection.boardId,
          userId: connection.userId,
          connectionId,
        })
      );
    }

    this.connections.delete(connectionId);
  }

  private joinBoardRoom(connectionId: string, boardId: string) {
    if (!this.boardRooms.has(boardId)) {
      this.boardRooms.set(boardId, new Set());
    }
    this.boardRooms.get(boardId)!.add(connectionId);
  }

  private leaveBoardRoom(connectionId: string, boardId: string) {
    const room = this.boardRooms.get(boardId);
    if (room) {
      room.delete(connectionId);
      if (room.size === 0) {
        this.boardRooms.delete(boardId);
      }
    }
  }

  private broadcastToBoard(boardId: string, senderId: string, message: string) {
    const room = this.boardRooms.get(boardId);
    if (!room) return;

    for (const connectionId of room) {
      if (connectionId === senderId) continue; // Don't send to sender

      const connection = this.connections.get(connectionId);
      if (connection?.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(message);
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
        }
      }
    }
  }

  private getUsersInBoard(boardId: string): string[] {
    const room = this.boardRooms.get(boardId);
    if (!room) return [];

    const users: string[] = [];
    for (const connectionId of room) {
      const connection = this.connections.get(connectionId);
      if (connection?.userId) {
        users.push(connection.userId);
      }
    }
    return [...new Set(users)]; // Remove duplicates
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Send a card update to all users in a board
   */
  broadcastCardUpdate(boardId: string, card: Partial<Card>, userId: string) {
    const message = JSON.stringify({
      type: 'card_update',
      boardId,
      card,
      userId,
      timestamp: Date.now(),
    });

    this.broadcastToBoard(boardId, '', message);
  }

  /**
   * Send a card move to all users in a board
   */
  broadcastCardMove(
    boardId: string,
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    newPosition: string,
    userId: string
  ) {
    const message = JSON.stringify({
      type: 'card_move',
      boardId,
      cardId,
      fromColumnId,
      toColumnId,
      newPosition,
      userId,
      timestamp: Date.now(),
    });

    this.broadcastToBoard(boardId, '', message);
  }

  /**
   * Send a card creation to all users in a board
   */
  broadcastCardCreate(boardId: string, card: Card, userId: string) {
    const message = JSON.stringify({
      type: 'card_create',
      boardId,
      card,
      userId,
      timestamp: Date.now(),
    });

    this.broadcastToBoard(boardId, '', message);
  }

  /**
   * Send a card deletion to all users in a board
   */
  broadcastCardDelete(boardId: string, cardId: string, columnId: string, userId: string) {
    const message = JSON.stringify({
      type: 'card_delete',
      boardId,
      cardId,
      columnId,
      userId,
      timestamp: Date.now(),
    });

    this.broadcastToBoard(boardId, '', message);
  }

  /**
   * Close the WebSocket server
   */
  close() {
    // Notify all connections
    for (const [connectionId, connection] of this.connections) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close(1000, 'Server shutting down');
      }
    }

    this.wss.close();
    this.connections.clear();
    this.boardRooms.clear();
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      boardRooms: this.boardRooms.size,
      boards: Array.from(this.boardRooms.entries()).map(([boardId, connections]) => ({
        boardId,
        connections: connections.size,
      })),
    };
  }
}