import { Model } from "../base-model/model";


export interface IThread {
    id?: number,
    title: string,
    author: string,
    forum?: string,
    message: string,
    votes?: string,
    slug?: string,
    created: object | string,
}

export class ModelThread extends Model<IThread> {
    constructor(attrs: IThread = null) {
        super(attrs);

        const defaults: IThread = {
            id: null,
            title: null,
            author: null,
            forum: null,
            message: null,
            votes: null,
            created: {},
        };

        this.attrs = { ...defaults, ...attrs };
    }

    static serialize(data: any) {
        return {
            id: data.id,
            title: data.title,
            author: data.author,
            message: data.message,
            votes: data.votes,
            slug: data.slug,
            forum: data.forum,
            created: data.created,
        }
    }
}

