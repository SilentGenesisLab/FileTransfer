import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOSSClient, generateOSSKey } from "@/lib/oss";
import { generatePickupCode } from "@/lib/pickup-code";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const oss = getOSSClient();
    const uploadedFiles: { fileName: string; fileSize: number; ossKey: string; ossUrl: string }[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ossKey = generateOSSKey(file.name);
      const result = await oss.put(ossKey, buffer);

      uploadedFiles.push({
        fileName: file.name,
        fileSize: file.size,
        ossKey,
        ossUrl: result.url,
      });
    }

    let pickupCode = generatePickupCode();
    while (await prisma.transfer.findUnique({ where: { pickupCode } })) {
      pickupCode = generatePickupCode();
    }

    const transfer = await prisma.transfer.create({
      data: {
        pickupCode,
        type: "FILE",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        files: {
          create: uploadedFiles,
        },
      },
      include: { files: true },
    });

    return NextResponse.json({
      pickupCode: transfer.pickupCode,
      expiresAt: transfer.expiresAt,
      fileCount: transfer.files.length,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
