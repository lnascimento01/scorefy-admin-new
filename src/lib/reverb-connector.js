/**
 * ReverbConnector (standalone)
 * Versão simplificada, compatível com NEXT.JS (client-side only)
 * Não usa isomorphic-ws — usa WebSocket nativo do navegador.
 */

// Importa a classe base Connector diretamente do build ESM da lib
import { Connector } from 'laravel-echo/dist/echo.js'

export default class ReverbConnector extends Connector {
  constructor(options) {
    super(options);

    this.options = options;
    this.channels = {};
    this.socket = null;

    // monta URL final: ws://host:port
    this.url = `${options.scheme || 'ws'}://${options.host}`;
  }

  /**
   * Conecta ao WebSocket do Reverb
   */
  connect() {
    // garanta que estamos no browser
    if (typeof window === 'undefined') {
      throw new Error('[ReverbConnector] Only works in browser environment.');
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('[ReverbConnector] Connected:', this.url);
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.socket.onclose = () => {
      console.log('[ReverbConnector] Connection closed');
    };

    this.socket.onerror = (e) => {
      console.error('[ReverbConnector] Error:', e);
    };

    return this.socket;
  }

  /**
   * Trata mensagens recebidas
   */
  handleMessage(event) {
    try {
      const payload = JSON.parse(event.data);

      if (!payload.event || !payload.channel) return;

      const channel = this.channels[payload.channel];
      if (!channel) return;

      // dispara evento no Echo
      channel.listeners.forEach((callback) => {
        callback(payload.event, payload.data);
      });
    } catch (err) {
      console.error('[ReverbConnector] Error parsing message:', err);
    }
  }

  /**
   * Inscreve em um canal
   */
  subscribe(channelName) {
    if (!this.channels[channelName]) {
      this.channels[channelName] = {
        name: channelName,
        listeners: []
      };

      this.send({
        event: 'pusher:subscribe',
        data: { channel: channelName }
      });
    }

    return {
      listen: (eventName, callback) => {
        this.channels[channelName].listeners.push((event, data) => {
          if (event === eventName) callback(data);
        });

        return this;
      }
    };
  }

  /**
   * Desinscreve de um canal
   */
  unsubscribe(channelName) {
    if (this.channels[channelName]) {
      this.send({
        event: 'pusher:unsubscribe',
        data: { channel: channelName }
      });

      delete this.channels[channelName];
    }
  }

  /**
   * Envia mensagens para o servidor
   */
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Desconecta
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
