#!/usr/bin/env node
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { setup } from "./setup.js";

/**
 * HIGHSTORY MCP BRIDGE
 * Connects Local Claude Desktop (Stdio) to Remote High Story Server (WS)
 */

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
    const url = new URL(SSE_URL);
    url.searchParams.set('token', TOKEN);
    
    console.error(`[High Story] 🔄 Connecting to ${url.origin} (SSE)...`);
    const transport = new SSEClientTransport(url);

    // 2. Setup Stdio Transport for local Agent
    const stdioTransport = new StdioServerTransport();

    // 3. Bidirectional Relay Logic
    stdioTransport.onmessage = (message) => {
        transport.send(message).catch(err => {
            console.error("[High Story] ⚠️ Send failure:", err.message);
        });
    };

    transport.onmessage = (message) => {
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

    // 5. Establish Connection
    await transport.start();
    console.error("[High Story] ✅ Cloud connection established.");
    
    await stdioTransport.start();
    console.error("[High Story] 🟢 MCP Bridge active.");

    // Handle Graceful Shutdown
    const shutdown = async () => {
        console.error("\n[High Story] 💤 Shutting down...");
        await transport.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error: any) {
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
