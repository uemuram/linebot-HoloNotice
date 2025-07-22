import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-1' });

export const getItemFromDB = async (tableName, keyName, keyValue) => {
  console.log(`DB取得実行 : ${keyName} = ${keyValue}`);
  const key = {};
  key[keyName] = keyValue;

  const command = new GetCommand({
    TableName: tableName,
    Key: key,
    ConsistentRead: true,
  });

  try {
    const result = await client.send(command);
    const data = result.Item ? result.Item.data : null;
    console.log(`DB取得結果 : ${JSON.stringify(data)}`);
    return data;
  } catch (err) {
    console.error('DB取得エラー:', err);
    throw err;
  }
}

export const putItemToDB = async (tableName, keyName, keyValue, data) => {
  console.log(`DB登録実行 : ${keyName} = ${keyValue} / ${JSON.stringify(data)}`);
  const key = {};
  key[keyName] = keyValue;

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      ...key, // キー情報を展開
      data: data, // 任意のデータを格納
    },
  });

  try {
    await client.send(command);
    console.log(`DB登録成功`);
  } catch (err) {
    console.error("DB登録エラー:", err);
    throw err;
  }
};


// export async function deleteItemFromDB(key) {
//   console.log(`DB削除実行 : ${key}`);
//   const command = new DeleteCommand({
//     TableName: TABLE_NAME,
//     Key: { userId: key, },
//   });

//   try {
//     await client.send(command);
//     console.log(`DB削除成功`);
//   } catch (err) {
//     console.error('DB削除エラー:', err);
//     throw err;
//   }
// }




