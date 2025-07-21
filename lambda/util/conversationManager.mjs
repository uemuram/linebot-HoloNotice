export class conversationManager {
    constructor(userId) {
        this.userId = userId;
    }

    async test() {
        console.log(this.userId);
    }
}