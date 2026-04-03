import { NextRequest, NextResponse } from "next/server";
import { sendSmsCode } from "@/lib/sms";
import { storeCode, canSendCode } from "@/lib/code-store";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (!canSendCode(phone)) {
      return NextResponse.json({ error: "Please wait 60 seconds" }, { status: 429 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const sent = await sendSmsCode(phone, code);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }

    storeCode(phone, code);
    return NextResponse.json({ success: true, message: "Code sent" });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
