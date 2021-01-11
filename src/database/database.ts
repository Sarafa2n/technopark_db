import { config } from "../store/config";
import pgPromise from 'pg-promise';
import pg from "pg-promise/typescript/pg-subset";

const promise = require('bluebird');

export const pgp = require('pg-promise')({
    capSQL: true,
    promiseLib: promise
});

export default new class Database {
    public pgp: any;

    public db: pgPromise.IDatabase<{}, pg.IClient> & {};

    constructor() {
        this.pgp = pgp;
        this.db = pgp(config);
    }
}
