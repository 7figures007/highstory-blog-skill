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
    try {
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
        console.error(`[High Story] 🔄 Connecting to ${url.origin} (WS)...`);
        // Pass the 'mcp' protocol which is required by the server upgrade
        const transport = new WebSocketClientTransport(url);
        // 2. Setup Stdio Transport for local Agent
        const stdioTransport = new StdioServerTransport();
        // 3. Bidirectional Relay Logic with Buffer
        let isCloudReady = false;
        const messageBuffer = [];
        stdioTransport.onmessage = (message) => {
            if (!isCloudReady) {
                console.error(`[High Story Bridge] ⏳ Buffering message from Claude (WS connecting)...`);
                messageBuffer.push(message);
                return;
            }
            console.error(`[High Story Bridge] ⬆️ Relaying from Claude to Cloud: ${JSON.stringify(message).substring(0, 100)}...`);
            transport.send(message).catch(err => {
                console.error("[High Story] ⚠️ Send failure:", err.message);
            });
        };
        transport.onmessage = (message) => {
            console.error(`[High Story Bridge] ⬇️ Relaying from Cloud to Claude: ${JSON.stringify(message).substring(0, 100)}...`);
            stdioTransport.send(message).catch(err => {
                console.error("[High Story] ⚠️ Receive failure:", err.message);
            });
        };
        // 4. Lifecycle Management
        transport.onclose = () => {
            console.error("[High Story] 🔴 Cloud connection closed.");
            process.exit(0);
        };
        transport.onerror = (error) => {
            console.error("[High Story] ❌ WebSocket error:", error);
        };
        // 5. Establish Connections in the right order!
        await stdioTransport.start();
        console.error("[High Story] 🟢 MCP Bridge active (listening to Claude).");
        // Then connect to the cloud
        await transport.start();
        isCloudReady = true;
        console.error("[High Story] ✅ Cloud connection established.");
        // 6. Keep-Alive Heartbeat (Prevent Supabase Idle Timeout)
        const keepAlive = setInterval(() => {
            if (isCloudReady) {
                // Sending a simple ping to keep the WebSocket active
                transport.send({ jsonrpc: "2.0", method: "ping", params: {} }).catch(() => {
                    console.error("[High Story] ⚠️ Heartbeat failed.");
                });
            }
        }, 30000); // Every 30 seconds
        // Flush any buffered messages that Claude sent while we were connecting
        if (messageBuffer.length > 0) {
            console.error(`[High Story Bridge] 🚀 Flushing ${messageBuffer.length} buffered messages to Cloud...`);
            for (const msg of messageBuffer) {
                transport.send(msg).catch(err => console.error("[High Story] ⚠️ Send failure:", err.message));
            }
            messageBuffer.length = 0;
        }
        // Handle Graceful Shutdown
        const shutdown = async () => {
            console.error("\n[High Story] 💤 Shutting down...");
            clearInterval(keepAlive);
            await transport.close();
            process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
    catch (error) {
        console.error("[High Story] 💥 Bridge failure:", error.message);
        if (error.message?.includes("401")) {
            console.error("👉 AUTH ERROR: Invalid token. Run 'npx highstory-mcp setup' to refresh.");
        }
        process.exit(1);
    }
}
main().catch(err => {
    console.error("[High Story] 💀 Critical Failure:", err);
    process.exit(1);
});
