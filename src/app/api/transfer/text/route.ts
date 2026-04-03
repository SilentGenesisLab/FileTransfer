import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePickupCode } from "@/lib/pickup-code";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    let pickupCode = generatePickupCode();
    while (await prisma.transfer.findUnique({ where: { pickupCode } })) {
      pickupCode = generatePickupCode();
    }

    const user = await getCurrentUser().catch(() => null);

    const transfer = await prisma.transfer.create({
      data: {
        pickupCode,
        type: "TEXT",
        textContent: text,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId: user?.id ?? null,
      },
    });

    return NextResponse.json({
      pickupCode: transfer.pickupCode,
      expiresAt: transfer.expiresAt,
    });
  } catch (error) {
    console.error("Text transfer error:", error);
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}
