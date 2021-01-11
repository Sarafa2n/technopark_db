import { ModelUser } from "./user-model";
import UserRepository from './user-repository';
import { Response } from "../response/response";

export default new class UserView {

    async createUser(req: any, res: any) {
        const user = new ModelUser({
            nickname: req.params.nickname,
            email: req.body.email,
            about: req.body.about,
            fullname: req.body.fullname,
        });
        const dbUser: any[] = await UserRepository.getUsersByNicknameOrEmail(user.attrs.nickname, user.attrs.email);
        if (dbUser && dbUser.length) {
            return res.code(409).send(dbUser);
        }

        const result: Response = await UserRepository.create(user);
        return res.code(result.attrs.status).send(result.attrs.body);
    }

    async get(req: any, res: any) {
        const user = await UserRepository.getByNickname(req.params.nickname);

        if (!user) {
            return res.code(404).send({ message: 'Can\'t find user with nickname ' + req.params.nickname })
        } else {
            return res.send(user);
        }
    }

    async updateUser(req: any, res: any) {
        const user = await UserRepository.getByNickname(req.params.nickname);
        const updateUser = new ModelUser({
            nickname: req.params.nickname,
            email: req.body.email,
            about: req.body.about,
            fullname: req.body.fullname,
        });

        if (!user) {
            return res.code(404).send({ message: 'Can\'t find user with nickname ' + req.params.nickname })
        }

        const update = await UserRepository.update(updateUser);

        if (!update) {
            return res.code(409).send({ message: 'Can\'t change user with nickname ' + req.params.nickname })
        }

        const body = update === true ? user : update;

        return res.send(body);
    }

}
