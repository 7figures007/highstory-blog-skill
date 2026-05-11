#!/usr/bin/env node
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { setup } from "./setup.js";
/**
 * HIGHSTORY MCP BRIDGE
 * Connects Local Claude Desktop (Stdio) to Remote High Story Server (WS)
 */
// Patch global WebSocket to ignore subprotocols. 
// This prevents strict Node.js (undici) clients from crashing with "Server did not respond with sent protocols" 
// when the Supabase Deno runtime drops or mismanages the Sec-WebSocket-Protocol header.
const OriginalWebSocket = global.WebSocket;
global.WebSocket = class extends OriginalWebSocket {
    constructor(url, protocols) {
        // Drop the protocols argument entirely
        super(url);
    }
};
async function main() {
    // Check for setup command first
    if (process.argv.includes("setup")) {
        await setup();
        return;
    }
    const SSE_URL = process.env.HIGHSTORY_SSE_URL;
    const TOKEN = process.env.HIGHSTORY_TOKEN;
    if (!SSE_URL || !TOKEN) {
        console.error("\n❌ Error: Missing configuration.");
        console.error("Please run 'npx highstory-mcp setup' to configure your environment.\n");
        process.exit(1);
    }
    async function connect() {
        let isCloudReady = false;
        let lastInitializeMessage = null;
        const messageBuffer = [];
        // 1. Prepare WebSocket Connection
        let wsString = SSE_URL;
        if (wsString.startsWith('http')) {
            wsString = wsString.replace(/^http/i, 'ws');
            if (!wsString.includes('/mcp/ws')) {
                wsString = wsString.replace(/\/+$/, '') + '/mcp/ws';
            }
        }
        const url = new URL(wsString);
        url.searchParams.set('token', TOKEN);
        console.error(`[High Story] 🔄 Connecting to Cloud...`);
        const transport = new WebSocketClientTransport(url);
        // 2. Relay logic
        stdioTransport.onmessage = (message) => {
            // Capture initialize message to replay it on reconnection
            if (message.method === 'initialize') {
                lastInitializeMessage = message;
            }
            if (!isCloudReady) {
                messageBuffer.push(message);
                return;
            }
            transport.send(message).catch(err => console.error("[High Story] ⚠️ Send failure:", err.message));
        };
        transport.onmessage = (message) => {
            stdioTransport.send(message).catch(err => console.error("[High Story] ⚠️ Receive failure:", err.message));
        };
        // 3. Robust Lifecycle
        transport.onclose = () => {
            console.error("[High Story] ⚠️ Cloud connection lost. Reconnecting in 1s...");
            isCloudReady = false;
            setTimeout(connect, 1000); // Silent Reconnect
        };
        transport.onerror = (error) => {
            console.error("[High Story] ❌ WebSocket error:", error);
        };
        try {
            await transport.start();
            isCloudReady = true;
            console.error("[High Story] ✅ Cloud connection established.");
            // If we have a saved initialize message, replay it immediately
            if (lastInitializeMessage) {
                console.error("[High Story] 🔄 Replaying handshake...");
                await transport.send(lastInitializeMessage);
            }
            // Flush buffer
            if (messageBuffer.length > 0) {
                for (const msg of messageBuffer) {
                    await transport.send(msg);
                }
                messageBuffer.length = 0;
            }
            // Heartbeat
            const keepAlive = setInterval(() => {
                if (isCloudReady) {
                    transport.send({ jsonrpc: "2.0", method: "ping", params: {} }).catch(() => { });
                }
                else {
                    clearInterval(keepAlive);
                }
            }, 30000);
        }
        catch (error) {
            console.error("[High Story] 💥 Connection failed. Retrying in 5s...");
            setTimeout(connect, 5000);
        }
    }
    // Initial Stdio Start (Must be persistent)
    const stdioTransport = new StdioServerTransport();
    await stdioTransport.start();
    console.error("[High Story] 🟢 MCP Bridge active (listening to Claude).");
    // Initial Connection
    await connect();
    // Handle Graceful Shutdown
    const shutdown = async () => {
        console.error("\n[High Story] 💤 Shutting down...");
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
main().catch(err => {
    console.error("[High Story] 💀 Critical Failure:", err);
    process.exit(1);
});
