require("dotenv").config();

const prisma = require("../src/config/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD must be configured in .env",
    );
  }

  if (password.length < 12) {
    throw new Error("SUPER_ADMIN password must be at least 12 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: {
      email: normalizedEmail,
    },
    update: {
      name: name.trim(),
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log("SUPER_ADMIN seeder completed!");
  console.log(admin);
}

main()
  .catch((error) => {
    console.error("Seeder failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
