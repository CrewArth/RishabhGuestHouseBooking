import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const getPassword = async () => {
  const cliPassword = process.argv.slice(2).join(" ").trim();

  if (cliPassword) {
    return cliPassword;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const password = await rl.question("Enter password to hash: ");
    return password.trim();
  } finally {
    rl.close();
  }
};

const run = async () => {
  const password = await getPassword();

  if (!password) {
    console.error("Password is required.");
    process.exit(1);
  }

  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  console.log("\nHashed password:\n");
  console.log(hash);
};

run().catch((error) => {
  console.error("Failed to hash password:", error.message);
  process.exit(1);
});