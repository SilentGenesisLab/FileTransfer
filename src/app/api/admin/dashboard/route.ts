import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalFiles,
      totalUsers,
      totalTransfers,
      tempTransfers,
      dau,
      mau,
      storageByUser,
      totalStorageResult,
    ] = await Promise.all([
      prisma.file.count(),
      prisma.user.count(),
      prisma.transfer.count(),
      prisma.transfer.count({ where: { userId: null } }),
      prisma.user.count({
        where: { lastLoginAt: { gte: todayStart } },
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          phone: true,
          nickname: true,
          role: true,
          transfers: {
            select: {
              files: {
                select: { fileSize: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.file.aggregate({
        _sum: { fileSize: true },
      }),
    ]);

    const totalStorageBytes = totalStorageResult._sum.fileSize || 0;

    const userStorage = storageByUser
      .map((u) => {
        const bytes = u.transfers.reduce(
          (sum, t) => sum + t.files.reduce((s, f) => s + f.fileSize, 0),
          0,
        );
        return {
          id: u.id,
          phone: u.phone,
          nickname: u.nickname,
          role: u.role,
          storageBytes: bytes,
        };
      })
      .sort((a, b) => b.storageBytes - a.storageBytes);

    return NextResponse.json({
      totalFiles,
      totalUsers,
      totalTransfers,
      tempTransfers,
      totalStorageBytes,
      dau,
      mau,
      userStorage,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Dashboard failed" }, { status: 500 });
  }
}
