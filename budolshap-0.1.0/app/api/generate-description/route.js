import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export async function POST(req) {
  try {
    const { name, category, categoryId } = await req.json();

    let categoryLabel = category;

    // If categoryId is provided but category label is not, fetch it from DB
    if (categoryId && !categoryLabel) {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true }
      });
      if (cat) {
        categoryLabel = cat.name;
      }
    }

    if (!name || (!categoryLabel && !categoryId)) {
      return NextResponse.json(
        { error: 'Product name and category are required' },
        { status: 400 }
      );
    }

    // Use categoryLabel for the AI prompt
    const finalCategory = categoryLabel || "General";

    // Mock response if no API key is configured (or if using the mock-key)
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key') {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      return NextResponse.json({
        description: `
          <p>🔥 <strong>${name}</strong> is here! 🔥</p>
          <p>Bes, ito na ang sign na hinihintay mo! Upgrade your ${finalCategory} game with this amazing item. ✨</p>
          <p>✅ High quality<br>✅ Super sulit<br>✅ Must-have!</p>
          <p>Don't miss out, add to cart na! 🛒🏃‍♂️💨</p>
          <p><em>(Note: Configure OPENAI_API_KEY to generate real AI descriptions)</em></p>
        `
      });
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter for 'Budol', a Filipino e-commerce platform. Write a catchy, persuasive, and fun product description in Taglish (Tagalog-English mix) that makes people want to buy immediately. Use emojis. Format the output with HTML tags (p, ul, li, strong) for rich text editors. Keep it under 150 words."
        },
        {
          role: "user",
          content: `Write a description for a product named "${name}" in the category "${finalCategory}".`
        }
      ],
      model: "gpt-3.5-turbo",
    });

    const description = completion.choices[0].message.content;

    return NextResponse.json({ description });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
