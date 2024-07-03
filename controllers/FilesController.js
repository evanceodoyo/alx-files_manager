import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const parent = parentId === 0 ? null : await (await dbClient.filesCollection()).findOne({
      _id: ObjectId(parentId),
    });
    if (parentId !== 0) {
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : ObjectId(parentId),
    };

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const localPath = path.join(folderPath, uuidv4());
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      fileDocument.localPath = localPath;
    }

    const result = await (await dbClient.filesCollection()).insertOne(fileDocument);

    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    const fileDocument = await (await dbClient.filesCollection()).findOne({
      _id: ObjectId(fileId), userId: ObjectId(userId),
    });

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(fileDocument);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId ? ObjectId(req.query.parentId) : 0;
    const page = req.query.page ? parseInt(req.query.page, 10) : 0;
    const pageSize = 20;

    const fileDocuments = await (await dbClient.filesCollection())
      .aggregate([
        { $match: { userId: ObjectId(userId), parentId } },
        { $skip: page * pageSize },
        { $limit: pageSize },
      ])
      .toArray();

    return res.status(200).json(fileDocuments);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const filter = { _id: ObjectId(fileId), userId: ObjectId(userId) };

    const fileDocument = await (await dbClient.filesCollection()).findOne(filter);

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    await (await dbClient.filesCollection()).updateOne(filter, { $set: { isPublic: true } });

    return res.status(200).json({
      id: fileId,
      userId,
      name: fileDocument.name,
      type: fileDocument.type,
      isPublic: true,
      parentId: fileDocument.parentId.toString(),
    });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const filter = { _id: ObjectId(fileId), userId: ObjectId(userId) };

    const fileDocument = await (await dbClient.filesCollection()).findOne(filter);

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    await (await dbClient.filesCollection()).updateOne(filter, { $set: { isPublic: false } });

    return res.status(200).json({
      id: fileId,
      userId,
      name: fileDocument.name,
      type: fileDocument.type,
      isPublic: false,
      parentId: fileDocument.parentId.toString(),
    });
  }
}
