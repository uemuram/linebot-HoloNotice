import { execOnline } from './execOnline.mjs';
import { execBatch } from './execBatch.mjs';

const MODE = process.env.MODE;

export const handler = async (req) => {

  if (MODE == "batch") {
    console.log("処理開始(バッチモード)");
    await execBatch();
    return;
  } else {
    console.log("処理開始(オンラインモード)");
    await execOnline(req);
    return { statusCode: 200 };
  }

};
