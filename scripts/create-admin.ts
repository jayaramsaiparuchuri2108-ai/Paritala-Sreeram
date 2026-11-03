// Creates (or resets the password of) an admin user. There is no public registration.
//   npm run admin:create
// Reads UPSTASH_* from .env.local if present. Without them it writes to the local dev store (.data/db.json).
import readline from "node:readline";
import { hashPassword, validatePasswordStrength } from "../lib/auth/password.ts";
import { getStore } from "../lib/database/store.ts";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const out = rl as unknown as { _writeToOutput: (s: string) => void };
      out._writeToOutput = (s: string) => {
        if (s.includes(question)) process.stdout.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("That does not look like a valid email address.");
  process.exit(1);
}
const password = process.env.ADMIN_PASSWORD || (await ask("Password (min 12 chars, hidden): ", true));
const problem = validatePasswordStrength(password);
if (problem) {
  console.error(problem);
  process.exit(1);
}

const store = getStore();
await store.put("users", email, {
  email,
  passwordHash: await hashPassword(password),
  role: "admin",
  createdAt: new Date().toISOString(),
});
console.log(`Admin user saved in ${store.mode === "upstash" ? "Upstash Redis" : "local dev store (.data/db.json)"}: ${email}`);
process.exit(0);
