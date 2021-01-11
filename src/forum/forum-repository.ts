import { ModelForum } from "./forum-model";
import { Response } from "../response/response";
import Database from "../database/database";
import { ModelUser } from "../user/user-model";

export default new class ForumRepository {
    private dbcon: typeof Database;

    constructor() {
        this.dbcon = Database;
    }

    async createForum(forum: ModelForum, user: ModelUser): Promise<Response> {
        const response: Response = new Response();
        const { slug, title } = forum.attrs;
        const { id, nickname } = user.attrs;

        try {
            const data = await this.dbcon.db.one('INSERT INTO forums (slug, title, nickname) VALUES ($1, $2, $3) RETURNING id, slug, title, nickname, posts, threads',[slug, title,nickname]);
            response.attrs.body = ModelForum.serialize(data);
            response.attrs.status = 201;
        } catch (e) {
            response.attrs.status = 500;
            response.attrs.body = { message: e.message };
        }

        return response
    }

    async getById(id: number) {
        try {
            return await this.dbcon.db.oneOrNone(`SELECT id, slug, title, nickname, posts, threads FROM forums WHERE id = $1`, id);
        } catch  {}
    }

    async getBySlug(slug: string) {
        try {
            return await this.dbcon.db.oneOrNone(`SELECT id, slug, title, nickname, posts, threads FROM forums WHERE slug = $1`, slug);
        } catch  {}
    }

    async addPostsCount(slug: string, count: number) {
        const response: Response = new Response();

        try {
            await this.dbcon.db.none('UPDATE forums SET posts = posts + $1 WHERE slug = $2', [count, slug]);
            response.attrs.status = 200;
        } catch (e) {
            response.attrs.status = 500;
        }

        return response;
    }

    async addThreadCount(id: number, count: number): Promise<Response> {
        const response: Response = new Response();
        count = !count ? 1 : count;

        try {
            await this.dbcon.db.none('UPDATE forums SET threads = threads + $1 WHERE id = $2', [count, id]);
            response.attrs.status = 200;
        } catch (e) {
            response.attrs.status = 500;
            response.attrs.body = { message: e.message };
        }

        return response;
    }

    async getCount() {
        try {
            const items = await this.dbcon.db.one(`SELECT count(id) FROM forums`);
            return items ? Number(items.count) : 1;
        } catch (error) {
        }
    }

    async clearAll() {
        try {
            return await this.dbcon.db.none(`TRUNCATE forums CASCADE`);
        } catch (error) {}
    }
}
