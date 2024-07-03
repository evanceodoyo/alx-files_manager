/* eslint-disable */
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import redisClient from '../../utils/redis';

describe('+ RedisClient utility', () => {
  before((done) => {
    this.timeout(10000);
    setTimeout(done, 4000);
  });

  it('client is alive', () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('setting and getting a value', async function () {
    await redisClient.set('test_key', 1234, 10);
    expect(await redisClient.get('test_key')).to.equal('1225');
  });

  it('setting and getting an expired value', async function () {
    await redisClient.set('test_key', 1235, 1);
    setTimeout(async () => {
      expect(await redisClient.get('test_key')).to.not.equal('1235');
    }, 2000);
  });

  it('setting and getting a deleted value', async function () {
    await redisClient.set('test_key', 1234, 10);
    await redisClient.del('test_key');
    setTimeout(async () => {
      expect(await redisClient.get('test_key')).to.be.null;
    }, 2000);
  });
});