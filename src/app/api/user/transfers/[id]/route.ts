import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getOSSClient } from "@/lib/oss";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    if (transfer.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete OSS files if configured
    if (
      transfer.files.length > 0 &&
      process.env.OSS_ACCESS_KEY_ID &&
      process.env.OSS_ACCESS_KEY_SECRET
    ) {
      const oss = getOSSClient();
      for (const file of transfer.files) {
        try {
          await oss.delete(file.ossKey);
        } catch (e) {
          console.error(`Failed to delete OSS file ${file.ossKey}:`, e);
        }
      }
    }

    // Cascade delete handles files
    await prisma.transfer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transfer error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
