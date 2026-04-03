import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transfers = await prisma.transfer.findMany({
      where: { userId: user.id },
      include: { files: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      transfers: transfers.map((t) => ({
        id: t.id,
        pickupCode: t.pickupCode,
        type: t.type,
        textContent: t.textContent,
        expiresAt: t.expiresAt,
        createdAt: t.createdAt,
        expired: new Date() > t.expiresAt,
        files: t.files.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          fileSize: f.fileSize,
          ossUrl: f.ossUrl,
        })),
      })),
    });
  } catch (error) {
    console.error("List transfers error:", error);
    return NextResponse.json({ error: "Failed to list transfers" }, { status: 500 });
  }
}
