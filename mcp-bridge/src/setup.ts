import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { fileURLToPath } from 'url';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => 
  new Promise((resolve) => rl.question(query, resolve));

/**
 * High Story Setup Utility
 * Automates MCP configuration for Claude Desktop and Skill installation for Antigravity.
 */
export async function setup() {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 HIGH STORY - PROFESSIONAL AGENT SETUP");
  console.log("=".repeat(50) + "\n");

  try {
    // 1. Token Acquisition
    console.log("👉 Step 1: Authentication");

    // Support --key argument for automation
    const keyArgIndex = process.argv.indexOf('--key');
    let token = keyArgIndex !== -1 ? process.argv[keyArgIndex + 1] : null;

    if (!token) {
      console.log("   Retrieve your permanent API token from:");
      console.log("   https://app.highstory.ai/settings?tab=api\n");
      token = await question("🔑 Enter your HIGHSTORY_TOKEN: ");
    } else {
      console.log("   🔑 Token provided via argument.");
    }

    if (!token || token.trim().length < 20) {
      throw new Error("Invalid token. Please provide a valid High Story JWT.");
    }

    const sseUrl = "https://jeprtikkylotvcddrqvm.supabase.co/functions/v1/highstory-mcp-server";

    const isMac = process.platform === 'darwin';
    const configPath = isMac 
      ? path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
      : path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');

    console.log(`   Config Path: ${configPath}`);

    let config: any = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(content);
      } catch (e) {
        console.warn("   ⚠️ Warning: Existing config is corrupted. Starting fresh.");
      }
    }

    if (!config.mcpServers) config.mcpServers = {};

    // Define the server entry
    config.mcpServers.highstory = {
      command: "npx",
      args: ["-y", "highstory-mcp"],
      env: {
        HIGHSTORY_SSE_URL: sseUrl,
        HIGHSTORY_TOKEN: token.trim()
      }
    };

    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("   ✅ Claude Desktop configuration updated.");

    // 3. Skill Installation (Antigravity/Agentic)
    console.log("\n👉 Step 3: Agent Skill Installation");
    
    const antigravityDir = path.join(os.homedir(), '.gemini', 'antigravity', 'skills');
    const skillName = 'highstory-social-media-manager';
    const skillDest = path.join(antigravityDir, skillName);
    
    // Find skill source (the root of this repo if we are in mcp-bridge)
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    
    // In npx/dist, the root is two levels up from dist
    let skillSource = path.join(__dirname, '..', '..');
    
    // Check if we are running in npx (node_modules/highstory-mcp)
    if (!fs.existsSync(path.join(skillSource, 'SKILL.md'))) {
        // Fallback for different installation structures
        skillSource = path.join(__dirname, '..');
    }

    if (fs.existsSync(skillSource)) {
      console.log(`   Installing skill to: ${skillDest}`);
      
      if (!fs.existsSync(antigravityDir)) {
        fs.mkdirSync(antigravityDir, { recursive: true });
      }

      // Force clean installation
      if (fs.existsSync(skillDest)) {
        fs.rmSync(skillDest, { recursive: true, force: true });
      }
      
      // Copy recursive for a robust, standalone installation
      fs.cpSync(skillSource, skillDest, { recursive: true });
      console.log("   ✅ Skill installed successfully.");
    } else {
      console.warn("   ⚠️ Warning: Bundled skill source not found. Skipping skill install.");
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 SETUP COMPLETE!");
    console.log("1. Restart Claude Desktop");
    console.log("2. Refresh your Antigravity session");
    console.log("=".repeat(50) + "\n");

  } catch (error: any) {
    console.error(`\n❌ Fatal Error: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}
