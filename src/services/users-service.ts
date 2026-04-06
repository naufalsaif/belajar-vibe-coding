import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

export const usersService = {
  async registerUser(payload: any) {
    const { name, email, password } = payload;

    // 1. Cek apakah email sudah terdaftar
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "Email sudah terdaftar" };
    }

    // 2. Hash password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Simpan user ke database
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return { data: "OK" };
  },

  async loginUser(payload: any) {
    const { email, password } = payload;

    // 1. Cari user berdasarkan email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return { error: "Email atau password salah" };
    }

    // 2. Bandingkan password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return { error: "Email atau password salah" };
    }

    // 3. Generate session token (UUID)
    const token = randomUUID();

    // 4. Simpan session ke database
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { data: token };
  },
};
