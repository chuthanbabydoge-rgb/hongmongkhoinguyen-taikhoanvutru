import type { IAvatarRepository } from "../repositories/IAvatarRepository";
import type { Avatar, UpdateAvatarInput } from "../models/avatar";
import { UpdateAvatarSchema, DEFAULT_AVATAR } from "../models/avatar";
import { ZodError } from "zod";

export class AvatarNotFoundError extends Error {
  constructor(userId: string) {
    super(`Avatar not found for user: ${userId}`);
    this.name = "AvatarNotFoundError";
  }
}

export class AvatarAlreadyExistsError extends Error {
  constructor(userId: string) {
    super(`Avatar already exists for user: ${userId}`);
    this.name = "AvatarAlreadyExistsError";
  }
}

export class AvatarValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarValidationError";
  }
}

export class AvatarRepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AvatarRepositoryError";
  }
}

export class AvatarService {
  constructor(private readonly repo: IAvatarRepository) {}

  async getMyAvatar(userId: string): Promise<Avatar> {
    try {
      const avatar = await this.repo.findByUserId(userId);
      if (!avatar) throw new AvatarNotFoundError(userId);
      return avatar;
    } catch (err) {
      if (err instanceof AvatarNotFoundError) throw err;
      throw new AvatarRepositoryError("Failed to fetch avatar", err);
    }
  }

  async getOrCreateAvatar(userId: string): Promise<{ avatar: Avatar; created: boolean }> {
    try {
      const existing = await this.repo.findByUserId(userId);
      if (existing) return { avatar: existing, created: false };
      const avatar = await this.repo.create({ userId, ...DEFAULT_AVATAR });
      return { avatar, created: true };
    } catch (err) {
      if (err instanceof AvatarRepositoryError) throw err;
      throw new AvatarRepositoryError("Failed to get or create avatar", err);
    }
  }

  async updateMyAvatar(userId: string, raw: unknown): Promise<Avatar> {
    let input: UpdateAvatarInput;
    try {
      input = UpdateAvatarSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AvatarValidationError(
          err.errors.map((e) => e.message).join("; ")
        );
      }
      throw err;
    }

    try {
      const updated = await this.repo.update(userId, input);
      if (!updated) throw new AvatarNotFoundError(userId);
      return updated;
    } catch (err) {
      if (err instanceof AvatarNotFoundError) throw err;
      if (err instanceof AvatarValidationError) throw err;
      throw new AvatarRepositoryError("Failed to update avatar", err);
    }
  }

  async resetMyAvatar(userId: string): Promise<Avatar> {
    try {
      const existing = await this.repo.findByUserId(userId);
      if (!existing) {
        return this.repo.create({ userId, ...DEFAULT_AVATAR });
      }
      const reset = await this.repo.reset(userId);
      if (!reset) throw new AvatarNotFoundError(userId);
      return reset;
    } catch (err) {
      if (err instanceof AvatarNotFoundError) throw err;
      if (err instanceof AvatarRepositoryError) throw err;
      throw new AvatarRepositoryError("Failed to reset avatar", err);
    }
  }
}
