import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { AppError } from "../utils/errors";

export const usersService = {
  /**
   * Mendaftarkan pengguna baru ke dalam database.
   * Melakukan pengecekan duplikasi email terlebih dahulu.
   * Jika email belum terdaftar, kata sandi akan di-hash menggunakan bcrypt
   * lalu disimpan secara aman di dalam database.
   *
   * @param payload Objek berisi name, email, dan password dari pengguna
   * @returns Objek sukses `{ data: "OK" }` jika berhasil mendaftar
   * @throws {AppError} Jika email sudah terdaftar sebelumnya (Status 400)
   */
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

  /**
   * Melakukan otentikasi (login) pengguna ke dalam sistem.
   * Memeriksa keberadaan email, lalu memverifikasi kecocokan password dengan hash dari database.
   * Jika sukses, sistem akan membuat sesi baru menghasilkan UUID (Bearer token).
   *
   * @param payload Objek berisi email dan password dari pencobaan login
   * @returns Objek balasan dengan identifier sesi otentikasi `{ data: token }`
   * @throws {AppError} Jika kombinasi email tidak ditemukan atau password salah (Status 401)
   */
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

  /**
   * Menarik data profil pengguna yang saat ini sedang masuk/aktif.
   * Fungsi ini menggunakan teknik penggabungan relasional (Inner Join)
   * dari tabel sesi ke tabel pengguna berdasarkan token identitas yang diberikan.
   *
   * @param token String otentikasi Bearer token UUID milik pengguna
   * @returns Objek berisi sekumpulan kelengkapan data pengguna tanpa password
   * @throws {AppError} Jika token tidak ditemukan / tidak valid (Status 401)
   */
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

  /**
   * Mencabut hak sesi akses aktif / Logout.
   * Melakukan pengecekan apakah token ada di database.
   * Jika ada, token otentikator tersebut akan dihapus secara persisten dari sistem.
   *
   * @param token String otentikasi Bearer token UUID milik pengguna
   * @returns Objek sukses `{ data: "OK" }` jika sesi berhasil dihancurkan
   * @throws {AppError} Jika token tersebut ilegal atau sudah expired (Status 401)
   */
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
