import { Server, WebSocket } from "ws";
import { PlatformMetrics } from "./analytics.metrics";

const wss = new Server({ port: Number(process.env.WS_PORT) || 5000 });

export function broadcastMetrics(metric: PlatformMetrics): void {
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(metric));
    }
  });
}

wss.on("connection", (ws: WebSocket) => {
  ws.send("Connected to real-time analytics");
});
