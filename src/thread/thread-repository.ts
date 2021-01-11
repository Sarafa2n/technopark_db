import Database from "../database/database";
import { ModelThread } from "./thread-model";
import { ModelForum } from "../forum/forum-model";
import { ModelUser } from "../user/user-model";
import { Response } from "../response/response";
import {validateColumn} from "../utils/utils";

export default new class ThreadRepository {
    private dbcon: typeof Database;

    constructor() {
        this.dbcon = Database;
    }

    async createThread(thread: ModelThread, forum: ModelForum, user: ModelUser): Promise<Response> {
        const response = new Response();

        try {
            response.attrs.body  = await this.dbcon.db.one('INSERT INTO threads (slug, author, author_id, forum, created, title, message) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, slug, author, forum, created, title, message, votes',
                [
                    thread.attrs.slug,
                    user.attrs.nickname,
                    user.attrs.id,
                    forum.attrs.slug,
                    thread.attrs.created,
                    thread.attrs.title,
                    thread.attrs.message,
                ]);
            response.attrs.status = 201;
        } catch (e) {
            response.attrs.status = 500;
            response.attrs.body = { message: e.message };
        }

        return response;
    }

    async getThread(type: string, value: string | number) {
        try {
            return await this.dbcon.db.oneOrNone(`SELECT id, slug, author, forum, created, title, message, votes FROM threads WHERE ${type} = $1`, value)
        } catch {}
    }

    async updateThread(id: number, thread: ModelThread) {
        try {
            const column_set = new this.dbcon.pgp.helpers.ColumnSet([
                validateColumn('message'), validateColumn('title')
            ], { table: 'threads' });

            let query = this.dbcon.pgp.helpers.update(thread.attrs, column_set, null, { emptyUpdate: true });

            if (query === true) {
                return true;
            } else {
                query += `WHERE id = ${id} RETURNING *`;
            }
            return await this.dbcon.db.oneOrNone(query);
        } catch {}
    }

    async getForumThread(params: any, slug: string): Promise<any[]> {
        const { since, desc, limit } = params;
        let request = 'select id, title, author, forum, message, votes, slug, created from threads where lower(forum) = lower($1) ';

        if (since) {
            if (desc) {
                request += 'and created <= $2 ';
            } else {
                request += 'and created >= $2 ';
            }
        }

        if (desc) {
            request += 'order by created desc ';
        } else {
            request += 'order by created asc ';
        }

        if (limit > -1) {
            request += 'limit $3 ';
        }

        try {
            return await this.dbcon.db.manyOrNone(request, [slug, since, limit]);
        } catch (e) {
        }
    }

    async createVote(voice: number, user: string, type: string, value: number | string) {
        const response = new Response();

        const request = type === 'id' ? 'VALUES ($1, $2, $3)' : 'SELECT $1, threads.id, $3 FROM threads WHERE threads.slug = $2';

        try {
            const data = await this.dbcon.db.tx((t) => {
               return t.batch([
                   t.none(`INSERT INTO votes as vote (nickname, thread, voice) ${request} ON CONFLICT ON CONSTRAINT votes_user_thread_unique DO UPDATE SET voice = $3`, [user, value, voice]),
                   t.one(`SELECT id, slug, author, forum, created, title, message, votes FROM threads WHERE ${type} = $1`, value),
               ]);
            });

            response.attrs.body = data[1];
            response.attrs.status = 200;
        } catch (e) {
            response.attrs.status = 500;
            response.attrs.body = e.message;
        }

        return response
    }

    async getCount() {
        try {
            const items = await this.dbcon.db.one(`SELECT count(id) FROM threads`);
            return items ? Number(items.count) : 1;
        } catch (error) {
        }
    }

    async clearAll() {
        try {
            return await this.dbcon.db.none(`TRUNCATE threads CASCADE`);
        } catch (error) {}
    }
}
