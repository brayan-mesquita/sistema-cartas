import { NextResponse } from "next/server";
import { testGoogleDriveConnection } from "@/lib/storage";

export async function GET() {
  try {
    const result = await testGoogleDriveConnection();
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Exceção ao testar o Google Drive.",
        error: error?.message || error,
      },
      { status: 500 }
    );
  }
}
