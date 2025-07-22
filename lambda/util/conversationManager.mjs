import { getItemFromDB, putItemToDB } from './dynamoDbUtil.mjs';

export class conversationManager {
    // コンストラクタ
    constructor(userId, convTableName) {
        this.userId = userId;
        this.convTableName = convTableName;
        this.convHistory = [];
    }

    // 初期化処理
    async init() {
        // 会話履歴を取得
        this.convHistory = await getItemFromDB(this.convTableName, 'userId', this.userId) || [];
    }

    // 会話を履歴に追加する
    addContent(role, content) {
        this.convHistory.push({ role: role, content: content });
    }

    // 状態を保存する
    async save() {
        // 会話履歴を取得
        await putItemToDB(this.convTableName, 'userId', this.userId, this.convHistory) || [];
    }

    async test() {
        console.log(this.userId);
    }
}