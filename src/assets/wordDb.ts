import { openDB } from 'idb';

export const wordDatabase = openDB('soundboard', 1, {
    upgrade(database, oldVersion, newVersion, transaction) {
        database.createObjectStore('words', {
            keyPath: 'id',
            autoIncrement: true,
        });
    },
});
