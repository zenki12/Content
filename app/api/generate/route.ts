import { NextResponse } from "next/server";
import { generateText } from "../../lib/ai-client.js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = await generateText({
      settings: body?.settings,
      messages: body?.messages,
    });

    return NextResponse.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không generate được nội dung.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
