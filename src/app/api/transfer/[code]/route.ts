import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const transfer = await prisma.transfer.findUnique({
      where: { pickupCode: code.toUpperCase() },
      include: { files: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Invalid pickup code" }, { status: 404 });
    }

    if (new Date() > transfer.expiresAt) {
      return NextResponse.json({ error: "Transfer has expired" }, { status: 410 });
    }

    return NextResponse.json({
      type: transfer.type,
      pickupCode: transfer.pickupCode,
      createdAt: transfer.createdAt,
      expiresAt: transfer.expiresAt,
      textContent: transfer.textContent,
      files: transfer.files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileSize: f.fileSize,
        ossUrl: f.ossUrl,
      })),
    });
  } catch (error) {
    console.error("Pickup error:", error);
    return NextResponse.json({ error: "Retrieval failed" }, { status: 500 });
  }
}
