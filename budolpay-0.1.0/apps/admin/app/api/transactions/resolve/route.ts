import { NextResponse } from "next/server";
import axios from "axios";

const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || "http://localhost:3003";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await axios.post(`${TRANSACTION_SERVICE_URL}/resolve`, body);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("[Admin API] Transaction Resolution Error:", error.message);
    return NextResponse.json(
      { error: error.response?.data?.error || "Failed to resolve transaction" },
      { status: error.response?.status || 500 }
    );
  }
}
