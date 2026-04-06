import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

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
};
