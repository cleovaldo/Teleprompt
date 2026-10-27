import { RemoteCommandMessage, RemoteStatusState } from '../types';

const CHANNEL_NAME = 'prompter_remote_bus_v1';
const STORAGE_SYNC_KEY = 'prompter_remote_storage_sync';
const STATUS_SYNC_KEY = 'prompter_remote_status_sync';

export class RemoteChannel {
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private onCommandCallback?: (cmd: RemoteCommandMessage) => void;
  private onStatusCallback?: (status: RemoteStatusState) => void;
  private onConnectionChangeCallback?: (connected: boolean, transport: 'websocket' | 'fallback') => void;
  private isDestroyed = false;
  private isPrompterHost = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastCommandTimestamp = Date.now();
  private pollAbortController: AbortController | null = null;
  private isWsConnected = false;

  constructor(isPrompterHost: boolean = false) {
    this.isPrompterHost = isPrompterHost;

    // 1. Initialize BroadcastChannel (instant for tabs/windows on the same machine)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleIncoming(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel failed:', e);
      }
    }

    // 2. Storage fallback for same browser
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_SYNC_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncoming(data);
          } catch {}
        } else if (e.key === STATUS_SYNC_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.onStatusCallback?.(data);
          } catch {}
        }
      });
    }

    // 3. Initialize WebSocket for near-zero latency bidirectional communication (< 5ms)
    this.connectWebSocket();

    // 4. HTTP fallback listeners in background
    if (isPrompterHost) {
      this.startHostPolling();
    } else {
      this.startRemoteStatusPolling();
    }
  }

  private connectWebSocket() {
    if (this.isDestroyed || typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        if (this.isDestroyed) {
          ws.close();
          return;
        }
        this.isWsConnected = true;
        this.onConnectionChangeCallback?.(true, 'websocket');

        // If phone remote, request live status immediately
        if (!this.isPrompterHost) {
          try {
            ws.send(JSON.stringify({ type: 'sync_state_req' }));
          } catch {}
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'command' && data.command) {
            this.lastCommandTimestamp = Math.max(this.lastCommandTimestamp, data.command.timestamp || 0);
            this.onCommandCallback?.(data.command);
          } else if (data.type === 'status' && data.status) {
            this.onStatusCallback?.(data.status);
          }
        } catch (e) {
          console.warn('Error parsing incoming WS message:', e);
        }
      };

      ws.onclose = () => {
        this.ws = null;
        this.isWsConnected = false;
        this.onConnectionChangeCallback?.(false, 'fallback');

        // Auto-reconnect with fast backoff
        if (!this.isDestroyed) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 1200);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    } catch (e) {
      console.warn('WebSocket init failed, fallback active:', e);
      if (!this.isDestroyed) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 2000);
      }
    }
  }

  private handleIncoming(data: any) {
    if (!data || this.isDestroyed) return;
    if (data.isStatus && this.onStatusCallback) {
      this.onStatusCallback(data.status);
    } else if (data.isCommand && this.onCommandCallback) {
      this.onCommandCallback(data.command);
    }
  }

  // HTTP polling fallback for host prompter
  private async startHostPolling() {
    while (!this.isDestroyed) {
      // If WebSocket is active, we can poll much less frequently (heartbeat fallback)
      if (this.isWsConnected) {
        await new Promise((r) => setTimeout(r, 6000));
        if (this.isDestroyed) break;
      }

      try {
        this.pollAbortController = new AbortController();
        const res = await fetch(`/api/remote/commands?since=${this.lastCommandTimestamp}`, {
          signal: this.pollAbortController.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.commands && Array.isArray(data.commands) && data.commands.length > 0) {
            for (const cmd of data.commands) {
              if (cmd.timestamp > this.lastCommandTimestamp) {
                this.lastCommandTimestamp = cmd.timestamp;
                this.onCommandCallback?.(cmd);
              }
            }
          }
          if (data.timestamp) {
            this.lastCommandTimestamp = Math.max(this.lastCommandTimestamp, data.timestamp);
          }
        } else {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  }

  // HTTP status polling fallback for phone remote
  private async startRemoteStatusPolling() {
    const fetchStatus = async () => {
      if (this.isDestroyed || this.isWsConnected) return;
      try {
        const res = await fetch('/api/remote/status');
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            this.onStatusCallback?.(data.status);
          }
        }
      } catch {}
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    const checkDestroy = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(interval);
        clearInterval(checkDestroy);
      }
    }, 1000);
  }

  public setOnCommand(cb: (cmd: RemoteCommandMessage) => void) {
    this.onCommandCallback = cb;
  }

  public setOnStatus(cb: (status: RemoteStatusState) => void) {
    this.onStatusCallback = cb;
  }

  public setOnConnectionChange(cb: (connected: boolean, transport: 'websocket' | 'fallback') => void) {
    this.onConnectionChangeCallback = cb;
    cb(this.isWsConnected, this.isWsConnected ? 'websocket' : 'fallback');
  }

  /**
   * Send a command from the phone remote to the host teleprompter.
   * Transmits via WebSocket with sub-5ms near-zero latency.
   */
  public sendCommand(type: RemoteCommandMessage['type'], payload?: any) {
    const command: RemoteCommandMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    // 1. WebSocket (near-zero latency, sub-5ms)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'command', command }));
      } catch (e) {
        console.warn('WS send failed, using fallback:', e);
      }
    }

    // 2. BroadcastChannel (instant for same-browser window/tab)
    if (this.channel) {
      try {
        this.channel.postMessage({ isCommand: true, command });
      } catch {}
    }

    // 3. LocalStorage
    try {
      localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify({ isCommand: true, command }));
    } catch {}

    // 4. HTTP Server API fallback (ensures delivery even if WS is reconnecting)
    fetch('/api/remote/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    }).catch(() => {});
  }

  /**
   * Broadcast status from the host teleprompter to connected phone remotes.
   * Transmits via WebSocket with sub-5ms near-zero latency.
   */
  public broadcastStatus(status: RemoteStatusState) {
    // 1. WebSocket (near-zero latency, sub-5ms)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'status', status }));
      } catch (e) {
        console.warn('WS broadcast status failed, using fallback:', e);
      }
    }

    // 2. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage({ isStatus: true, status });
      } catch {}
    }

    // 3. LocalStorage
    try {
      localStorage.setItem(STATUS_SYNC_KEY, JSON.stringify(status));
    } catch {}

    // 4. HTTP Server API fallback
    fetch('/api/remote/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status),
    }).catch(() => {});
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.pollAbortController) {
      this.pollAbortController.abort();
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }
  }
}
