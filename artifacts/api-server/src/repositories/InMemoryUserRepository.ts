import { randomUUID } from "node:crypto";
import type { User } from "../models/auth";
import type { CreateUserInput, IUserRepository } from "./IUserRepository";

export class InMemoryUserRepository implements IUserRepository {
  private store: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) return user;
    }
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) return user;
    }
    return null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(user.id, user);
    return user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    for (const user of this.store.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) return true;
    }
    return false;
  }

  async existsByUsername(username: string): Promise<boolean> {
    for (const user of this.store.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) return true;
    }
    return false;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
