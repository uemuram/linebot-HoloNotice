import { getItemFromDB, putItemToDB } from './dynamoDbUtil.mjs';
import { askGemini } from './geminiUtil.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class conversationManager {

    // ------------ コンストラクタ ------------
    constructor(userId, convTableName, intentList, convHistoryMaxLength) {
        // ユーザID
        this.userId = userId;
        // 会話履歴が保存されるテーブル名
        this.convTableName = convTableName;
        // 目的の一覧
        this.intentList = intentList;
        // DBに保存される会話の最大数
        this.convHistoryMaxLength = convHistoryMaxLength;

        // 会話履歴
        this.convHistory = [];
        // 現在の会話の目的
        this.currentIntent = {};
    }

    // ------------ パブリックメソッド ------------
    // 初期化処理
    async init() {
        // 会話履歴をDBから取得
        this.convHistory = await getItemFromDB(this.convTableName, 'userId', this.userId) || [];
    }

    // 会話を履歴に追加する(ユーザ側)
    addUserContent(content) {
        this.convHistory.push({ role: 'ユーザ', content: content });
    }

    // 会話を履歴に追加する(AI側)
    addAIContent(content) {
        this.convHistory.push({ role: 'あなた', content: content });
    }

    // 会話を分類して現状の目的(currentIntent)を確定させる
    async classify() {
        // プロンプトを生成
        const promptPath = path.join(__dirname, 'prompt', 'classifyPrompt.txt');
        const intentListStr = this.intentList.map(item => `・${item.intentName}: ${item.description}`).join('\n');
        const convHistoryStr = this.convHistory.map(item => `・${item.role}: ${item.content}`).join('\n');
        const promptStr = await this.#buildPrompt(promptPath, { intentList: intentListStr, convHistory: convHistoryStr });
        console.log(promptStr);

        // 生成AIに問い合わせる
        const aiResultStr = await askGemini(promptStr);
        console.log(aiResultStr);
        // 結果を保存 & 返却
        const aiResult = this.#convertAIResult(aiResultStr);
        this.currentIntent = this.intentList.find(intent => intent.intentName === aiResult.intentName) || {};

        return aiResult;
    }

    // 目的に対応したアクションを実行する
    async action() {
        // 目的が未設定の場合はエラーとする
        if (!this.currentIntent) throw new Error('目的未設定');
        // TODO 目的がintentListに入っていない場合はエラー

        await this.currentIntent.preAction();
        await this.currentIntent.postAction();
    }

    // 状態をDBに保存する
    async save() {
        // 会話の最大長を超えないように古いものから削る
        if (this.convHistory.length > this.convHistoryMaxLength) {
            this.convHistory.splice(0, this.convHistory.length - this.convHistoryMaxLength);
        }
        // 会話履歴を保存
        await putItemToDB(this.convTableName, 'userId', this.userId, this.convHistory) || [];
    }

    // ------------ プライベートメソッド ------------
    // 問い合わせ用のテンプレート文字列を生成する
    async #buildPrompt(filePath, values) {
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

    // 生成AIからのJSONレスポンスをオブジェクト形式に変換する
    #convertAIResult(aiResultStr) {
        let jsonStr = '';
        // ```json ～ ``` に囲まれている場合は中身だけ抽出
        const fencedMatch = aiResultStr.match(/```json\s*([\s\S]*?)\s*```/);
        if (fencedMatch) {
            jsonStr = fencedMatch[1].trim();
        } else {
            // 囲いがない場合はそのままパースを試みる
            jsonStr = aiResultStr.trim();
        }
        return JSON.parse(jsonStr);
    }
}