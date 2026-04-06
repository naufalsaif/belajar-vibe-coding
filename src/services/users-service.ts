import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { AppError } from "../utils/errors";

export const usersService = {
  async registerUser(payload: any) {
    const { name, email, password } = payload;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new AppError(400, "Email sudah terdaftar");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return { data: "OK" };
  },

  async loginUser(payload: any) {
    const { email, password } = payload;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new AppError(401, "Email atau password salah");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new AppError(401, "Email atau password salah");
    }

    const token = randomUUID();

    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { data: token };
  },

  async getCurrentUser(token: string) {
    const result = await db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    const user = result[0]?.user;

    if (!user) {
      throw new AppError(401, "Unauthorized");
    }

    return { data: user };
  },

  async logoutUser(token: string) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!session) {
      throw new AppError(401, "Unauthorized");
    }

    await db.delete(sessions).where(eq(sessions.token, token));

    return { data: "OK" };
  },
};
