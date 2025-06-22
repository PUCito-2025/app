import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const geminiApiKey = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    const model = new GoogleGenAI({ apiKey: geminiApiKey });

    const result = await model.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const response = await result.text;

    return NextResponse.json({ message: "OK", data: response });
  } catch (error) {
    console.error("Error en Gemini:", error);
    return NextResponse.json(
      { message: "Error al conectar con Gemini", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
