import { Model } from "../base-model/model";

export interface IUser {
    id?: number,
    nickname: string,
    fullname?: string,
    about?: string,
    email?: string,
}

export class ModelUser extends  Model<IUser> {
    constructor(attrs: IUser = null) {
        super(attrs);

        const defaults: IUser = {
            nickname: null,
            fullname: null,
            about: null,
            email: null,
        };

        this.attrs = { ...defaults, ...attrs };
    }
}
