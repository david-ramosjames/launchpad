#!/usr/bin/env node
/**
 * Seed Launch Pad via the API route.
 * Usage: SEED_SECRET=xxx node scripts/seed.mjs [baseUrl]
 */
const baseUrl = process.argv[2] ?? "http://localhost:3000";
const secret = process.env.SEED_SECRET;

if (!secret) {
  console.error("Set SEED_SECRET in your environment.");
  process.exit(1);
}

const res = await fetch(`${baseUrl}/api/seed`, {
  method: "POST",
  headers: { "x-seed-secret": secret },
});

const body = await res.json();
if (!res.ok) {
  console.error("Seed failed:", body);
  process.exit(1);
}

console.log("Seed OK:", body);
