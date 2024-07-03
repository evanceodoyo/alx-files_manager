import dbClient from './utils/db';

(async () => {
  await dbClient.deleteFiles();
  console.log('Files deleted.');
})();
