import { Model } from "../base-model/model";

export interface IForum {
    id?: number,
    title: string,
    user: string,
    slug: string,
    posts?: number,
    threads?: number
}

export class ModelForum extends Model<IForum> {
    constructor(attrs: IForum = null) {
        super(attrs);

        const defaults: IForum = {
            title: null,
            user: null,
            slug: null,
            posts: null,
            threads: null
        };

        this.attrs = { ...defaults, ...attrs };
    }

    static serialize(data: any) {
        return {
            title: data.title,
            user: data.nickname,
            slug: data.slug,
            posts: data.posts,
            threads: data.threads
        }
    }
}
