/* eslint-disable */
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import dbClient from '../../utils/db';

describe('mongoDB Client utility', () => {
  before((done) => {
    this.timeout(10000);
    Promise.all([dbClient.filesCollection(), dbClient.usersCollection()])
      .then(([files, users]) => {
        Promise.all([files.deleteMany({}), users.deleteMany({})])
          .then(() => done())
          .catch((err) => done(err));
      })
      .catch((err) => done(err));
  });

  it('client is alive', () => {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it('nbFiles returns the correct value', async () => {
    expect(await dbClient.nbFiles()).to.equal(0);
  });

  it('nbUsers returns the correct value', async () => {
    expect(await dbClient.nbUsers()).to.equal(0);
  });
});
