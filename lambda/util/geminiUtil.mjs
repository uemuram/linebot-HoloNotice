import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Geminiにリクエストを投げる
export const askGemini = async (_prompt) => {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = _prompt;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text;
}

// テンプレートファイルを読み込む
export const renderTemplate = async (filePath, values) => {
  try {
    // テンプレートファイル読み込み
    const template = await fs.readFile(filePath, 'utf-8');

    // テンプレート文字列を関数として評価
    const compiled = new Function(...Object.keys(values), `return \`${template}\`;`);

    // 関数を実行して変数を埋め込む
    return compiled(...Object.values(values));
  } catch (err) {
    console.error('テンプレート処理エラー:', err);
    throw err;
  }
}
