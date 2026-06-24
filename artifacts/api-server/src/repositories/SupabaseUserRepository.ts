import { eq } from "drizzle-orm";
import type { User } from "../models/auth";
import type { CreateUserInput, IUserRepository } from "./IUserRepository";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

function toModel(row: typeof usersTable.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.passwordHash,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username.toLowerCase()))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const rows = await db
      .insert(usersTable)
      .values({
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        passwordHash: input.passwordHash,
      })
      .returning();
    if (!rows[0]) throw new Error("Insert failed — no row returned");
    return toModel(rows[0]);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const rows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);
    return rows.length > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const rows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username.toLowerCase()))
      .limit(1);
    return rows.length > 0;
  }
}
