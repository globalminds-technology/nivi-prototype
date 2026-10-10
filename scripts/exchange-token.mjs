import fs from "fs";

const code = process.argv[2]?.trim();

if (!code) {
  console.error("\n❌ Error: Please provide the generated code.");
  console.log("Usage: node scripts/exchange-token.mjs <GENERATED_CODE>\n");
  process.exit(1);
}

// Read .env
const envFile = fs.readFileSync(".env", "utf8");
const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
}

const accountsUrl = env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.in";
const tokenUrl = `${accountsUrl.replace(/\/+$/, "")}/oauth/v2/token`;

console.log("\n🔄 Exchanging code with Zoho...");

const params = new URLSearchParams({
  code,
  client_id: env.ZOHO_CLIENT_ID,
  client_secret: env.ZOHO_CLIENT_SECRET,
  grant_type: "authorization_code",
});

try {
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  if (data.error || !data.refresh_token) {
    console.error("\n❌ Zoho Error:", data.error || "No refresh token returned.");
    if (data.error === "invalid_code") {
      console.error("The code may have expired or already been used. Please generate a fresh code in api-console.zoho.in.");
    }
    console.log(data);
    process.exit(1);
  }

  // Update .env with new refresh token
  let updatedEnv = envFile.replace(
    /^ZOHO_REFRESH_TOKEN=.*/m,
    `ZOHO_REFRESH_TOKEN=${data.refresh_token}`,
  );

  fs.writeFileSync(".env", updatedEnv, "utf8");

  console.log("\n✅ SUCCESS!");
  console.log("New ZOHO_REFRESH_TOKEN has been saved to your .env file.");
  if (data.scope) {
    console.log("Authorized scopes:", data.scope);
  }
  console.log("\nYou can now restart your dev server (or keep it running) and add products in the admin panel!\n");
} catch (err) {
  console.error("\n❌ Network error:", err.message);
  process.exit(1);
}
