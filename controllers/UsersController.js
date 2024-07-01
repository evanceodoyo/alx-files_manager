import sha1 from 'sha1';
import dbClient from '../utils/db';

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const usersCollection = await dbClient.usersCollection();
    const user = await usersCollection.findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const result = await usersCollection.insertOne({ email, password: sha1(password) });
    return res.status(201).json({ id: result.insertedId, email });
  }
}
