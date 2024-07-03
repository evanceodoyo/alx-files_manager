import { ObjectId } from 'mongodb';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import Queue from 'bull';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

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
