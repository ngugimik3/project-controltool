import { auth } from "../lib/auth";

async function main() {
  const username = process.env.ADMIN_USERNAME!;

  await auth.api.signUpEmail({
    body: {
      name: process.env.ADMIN_NAME!,
      email: `${username}@pct.local`,
      password: process.env.ADMIN_PASSWORD!,
      username,
    },
  });

  console.log("admin created:", username);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
