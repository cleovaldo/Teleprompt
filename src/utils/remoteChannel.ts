import { RemoteCommandMessage, RemoteStatusState } from '../types';

const CHANNEL_NAME = 'prompter_remote_bus_v1';
const STORAGE_SYNC_KEY = 'prompter_remote_storage_sync';
const STATUS_SYNC_KEY = 'prompter_remote_status_sync';

export class RemoteChannel {
  private channel: BroadcastChannel | null = null;
  private onCommandCallback?: (cmd: RemoteCommandMessage) => void;
  private onStatusCallback?: (status: RemoteStatusState) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleIncoming(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or failed:', e);
      }
    }

    // Storage fallback for cross-tab or browsers without BroadcastChannel
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
  }

  private handleIncoming(data: any) {
    if (!data) return;
    if (data.isStatus && this.onStatusCallback) {
      this.onStatusCallback(data.status);
    } else if (data.isCommand && this.onCommandCallback) {
      this.onCommandCallback(data.command);
    }
  }

  public setOnCommand(cb: (cmd: RemoteCommandMessage) => void) {
    this.onCommandCallback = cb;
  }

  public setOnStatus(cb: (status: RemoteStatusState) => void) {
    this.onStatusCallback = cb;
  }

  public sendCommand(type: RemoteCommandMessage['type'], payload?: any) {
    const command: RemoteCommandMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };
    const payloadWrapper = { isCommand: true, command };

    if (this.channel) {
      try {
        this.channel.postMessage(payloadWrapper);
      } catch {}
    }

    try {
      localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(payloadWrapper));
    } catch {}
  }

  public broadcastStatus(status: RemoteStatusState) {
    const payloadWrapper = { isStatus: true, status };
    if (this.channel) {
      try {
        this.channel.postMessage(payloadWrapper);
      } catch {}
    }
    try {
      localStorage.setItem(STATUS_SYNC_KEY, JSON.stringify(status));
    } catch {}
  }

  public destroy() {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
    }
  }
}
