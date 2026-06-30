import { AppDataSource } from "./data-source";

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  // No-op seed — content added by employees/salary specs
  console.log("Seed complete (no-op scaffold).");
  await AppDataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
