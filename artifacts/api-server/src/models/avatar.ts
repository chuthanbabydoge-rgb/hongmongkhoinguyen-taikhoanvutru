import { z } from "zod";

export const AvatarSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  avatarName: z.string().max(50).nullable(),
  avatarUrl: z.string().nullable(),
  frame: z.string().nullable(),
  title: z.string().max(50).nullable(),
  background: z.string().nullable(),
  accessories: z.array(z.string()).nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const UpdateAvatarSchema = z.object({
  avatarName: z.string().max(50).optional(),
  avatarUrl: z.string().optional(),
  frame: z.string().optional(),
  title: z.string().max(50).optional(),
  background: z.string().optional(),
  accessories: z.array(z.string()).optional(),
});

export type Avatar = z.infer<typeof AvatarSchema>;
export type UpdateAvatarInput = z.infer<typeof UpdateAvatarSchema>;

export const DEFAULT_AVATAR: Omit<Avatar, "id" | "userId" | "createdAt" | "updatedAt"> = {
  avatarName: "Universe Citizen",
  avatarUrl: null,
  frame: "frame-none",
  title: "Citizen",
  background: "bg-void",
  accessories: [],
};
