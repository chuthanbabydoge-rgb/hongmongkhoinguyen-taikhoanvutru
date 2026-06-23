import { randomUUID } from "node:crypto";
import type { Avatar, UpdateAvatarInput } from "../models/avatar";
import { DEFAULT_AVATAR } from "../models/avatar";
import type { CreateAvatarInput, IAvatarRepository } from "./IAvatarRepository";

export class InMemoryAvatarRepository implements IAvatarRepository {
  private store: Map<string, Avatar> = new Map();

  async findByUserId(userId: string): Promise<Avatar | null> {
    for (const avatar of this.store.values()) {
      if (avatar.userId === userId) return avatar;
    }
    return null;
  }

  async create(input: CreateAvatarInput): Promise<Avatar> {
    const now = new Date();
    const avatar: Avatar = {
      id: randomUUID(),
      userId: input.userId,
      avatarName: input.avatarName ?? DEFAULT_AVATAR.avatarName,
      avatarUrl: input.avatarUrl ?? DEFAULT_AVATAR.avatarUrl,
      frame: input.frame ?? DEFAULT_AVATAR.frame,
      title: input.title ?? DEFAULT_AVATAR.title,
      background: input.background ?? DEFAULT_AVATAR.background,
      accessories: input.accessories ?? DEFAULT_AVATAR.accessories,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(avatar.id, avatar);
    return avatar;
  }

  async update(userId: string, input: UpdateAvatarInput): Promise<Avatar | null> {
    for (const [id, avatar] of this.store.entries()) {
      if (avatar.userId === userId) {
        const updated: Avatar = {
          ...avatar,
          avatarName: input.avatarName !== undefined ? input.avatarName : avatar.avatarName,
          avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : avatar.avatarUrl,
          frame: input.frame !== undefined ? input.frame : avatar.frame,
          title: input.title !== undefined ? input.title : avatar.title,
          background: input.background !== undefined ? input.background : avatar.background,
          accessories: input.accessories !== undefined ? input.accessories : avatar.accessories,
          updatedAt: new Date(),
        };
        this.store.set(id, updated);
        return updated;
      }
    }
    return null;
  }

  async reset(userId: string): Promise<Avatar | null> {
    for (const [id, avatar] of this.store.entries()) {
      if (avatar.userId === userId) {
        const reset: Avatar = {
          ...avatar,
          ...DEFAULT_AVATAR,
          updatedAt: new Date(),
        };
        this.store.set(id, reset);
        return reset;
      }
    }
    return null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, avatar] of this.store.entries()) {
      if (avatar.userId === userId) {
        this.store.delete(id);
        return;
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}
