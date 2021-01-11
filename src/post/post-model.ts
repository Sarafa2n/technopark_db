import { Model } from "../base-model/model";

export interface IPost {
    id?: number,
    parent?: string,
    author: string,
    message: string,
    isEdited?: boolean,
    forum?: string,
    thread?: number,
    created?: string,
}

export class ModelPost extends Model<IPost> {
    constructor(attrs: IPost = null) {
        super(attrs);

        const defaults: IPost = {
            id: null,
            parent: null,
            author: null,
            message: null,
            isEdited: null,
            forum: null,
            thread: null,
            created: null,
        };

        this.attrs = { ...defaults, ...attrs };
    }

    static serialize(data: any) {
        return {
            forum: data.forum_slug,
            id: data.id,
            created: data.created,
            thread: data.thread_id,
            message: data.message,
            parent: data.parent_id,
            isEdited: data.edited,
            author: data.author,
        };
    }
}
