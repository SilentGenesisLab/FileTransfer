import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { getStoredCode } from "@/lib/code-store";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, password, phone, code } = await request.json();

    if (!username || !password || !phone || !code) {
      return NextResponse.json(
        { error: "所有字段均为必填" },
        { status: 400 }
      );
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "手机号格式不正确" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "用户名长度需在3-20个字符之间" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少6个字符" },
        { status: 400 }
      );
    }

    // Verify SMS code
    const storedCode = getStoredCode(phone);
    if (!storedCode || storedCode !== code) {
      return NextResponse.json(
        { error: "验证码无效或已过期" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "用户名已存在" },
        { status: 409 }
      );
    }

    // Check if phone already registered
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "该手机号已注册" },
        { status: 409 }
      );
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        phone,
        role: "USER",
        lastLoginAt: new Date(),
      },
    });

    const token = signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败" },
      { status: 500 }
    );
  }
}
