import { ObjectId } from 'mongodb';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import Queue from 'bull/lib/queue';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
const userQueue = Queue('userQueue');

async function generateThumbnail(filePath, size) {
  const thumbnail = await imageThumbnail(filePath, { width: size });
  fs.writeFileSync(`${filePath}_${size}`, thumbnail);
}

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;
  if (!fileId) {
    throw new Error('Missing userId');
  }
  if (!userId) {
    throw new Error('Missing fileId');
  }

  const file = await (await dbClient.filesCollection())
    .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

  if (!file) {
    throw new Error('File not found');
  }

  const sizes = [500, 250, 100];
  Promise.all(sizes.map((size) => generateThumbnail(file.localPath, size)))
    .then(() => {
      done();
    });
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const user = await (await dbClient.usersCollection())
    .findOne({ _id: ObjectId(userId) });

  if (!user) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${user.email}!`);
});
