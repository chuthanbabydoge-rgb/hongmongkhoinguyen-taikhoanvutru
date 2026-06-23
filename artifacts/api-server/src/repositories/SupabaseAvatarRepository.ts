import { eq } from "drizzle-orm";
import type { Avatar, UpdateAvatarInput } from "../models/avatar";
import { DEFAULT_AVATAR } from "../models/avatar";
import type { CreateAvatarInput, IAvatarRepository } from "./IAvatarRepository";
import { db } from "@workspace/db";
import { avatarsTable } from "@workspace/db/schema";

function toModel(row: typeof avatarsTable.$inferSelect): Avatar {
  return {
    id: row.id,
    userId: row.userId,
    avatarName: row.avatarName,
    avatarUrl: row.avatarUrl,
    frame: row.frame,
    title: row.title,
    background: row.background,
    accessories: (row.accessories as string[] | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SupabaseAvatarRepository implements IAvatarRepository {
  async findByUserId(userId: string): Promise<Avatar | null> {
    const rows = await db
      .select()
      .from(avatarsTable)
      .where(eq(avatarsTable.userId, userId))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async create(input: CreateAvatarInput): Promise<Avatar> {
    const rows = await db
      .insert(avatarsTable)
      .values({
        userId: input.userId,
        avatarName: input.avatarName ?? DEFAULT_AVATAR.avatarName,
        avatarUrl: input.avatarUrl ?? DEFAULT_AVATAR.avatarUrl,
        frame: input.frame ?? DEFAULT_AVATAR.frame,
        title: input.title ?? DEFAULT_AVATAR.title,
        background: input.background ?? DEFAULT_AVATAR.background,
        accessories: input.accessories ?? DEFAULT_AVATAR.accessories,
      })
      .returning();
    if (!rows[0]) throw new Error("Insert failed — no row returned");
    return toModel(rows[0]);
  }

  async update(userId: string, input: UpdateAvatarInput): Promise<Avatar | null> {
    const updateData: Partial<typeof avatarsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.avatarName !== undefined) updateData.avatarName = input.avatarName;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
    if (input.frame !== undefined) updateData.frame = input.frame;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.background !== undefined) updateData.background = input.background;
    if (input.accessories !== undefined) updateData.accessories = input.accessories;

    const rows = await db
      .update(avatarsTable)
      .set(updateData)
      .where(eq(avatarsTable.userId, userId))
      .returning();
    return rows[0] ? toModel(rows[0]) : null;
  }

  async reset(userId: string): Promise<Avatar | null> {
    const rows = await db
      .update(avatarsTable)
      .set({
        avatarName: DEFAULT_AVATAR.avatarName,
        avatarUrl: DEFAULT_AVATAR.avatarUrl,
        frame: DEFAULT_AVATAR.frame,
        title: DEFAULT_AVATAR.title,
        background: DEFAULT_AVATAR.background,
        accessories: DEFAULT_AVATAR.accessories,
        updatedAt: new Date(),
      })
      .where(eq(avatarsTable.userId, userId))
      .returning();
    return rows[0] ? toModel(rows[0]) : null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.delete(avatarsTable).where(eq(avatarsTable.userId, userId));
  }
}
