import type { Avatar, UpdateAvatarInput } from "../models/avatar";

export interface CreateAvatarInput {
  userId: string;
  avatarName?: string | null;
  avatarUrl?: string | null;
  frame?: string | null;
  title?: string | null;
  background?: string | null;
  accessories?: string[] | null;
}

export interface IAvatarRepository {
  findByUserId(userId: string): Promise<Avatar | null>;
  create(input: CreateAvatarInput): Promise<Avatar>;
  update(userId: string, input: UpdateAvatarInput): Promise<Avatar | null>;
  reset(userId: string): Promise<Avatar | null>;
  deleteByUserId(userId: string): Promise<void>;
}
