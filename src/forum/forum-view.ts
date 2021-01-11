import { ModelForum } from "./forum-model";
import { Response } from "../response/response";
import { ModelUser } from "../user/user-model";
import UserRepository from '../user/user-repository';
import ThreadRepository from '../thread/thread-repository';
import ForumRepository from './forum-repository';
import { ModelThread } from "../thread/thread-model";
import {convertToSlug, isId} from "../utils/utils";

export default new class ForumView {

    async createForum(req: any, res: any) {
        const forum = new ModelForum(req.body);
        const user = new ModelUser({ nickname: forum.attrs.user });
        const temp: any = await UserRepository.getByNickname(user.attrs.nickname);

        if (!temp) {
            return res.code(404).send({ message: `Can't find user with nickname ${user.attrs.nickname}`});
        }

        user.update(temp);

        const dbForum = await ForumRepository.getBySlug(forum.attrs.slug);

        if (dbForum) {
            return res.code(409).send(ModelForum.serialize(dbForum));
        }

        const data = await ForumRepository.createForum(forum, user);
        return res.code(data.attrs.status).send(data.attrs.body);

    }

    async getForumDetails(req: any, res: any) {
        const slug = req.params.slug;

        const forum = await ForumRepository.getBySlug(slug);

        if (!forum) {
            return res.code(404).send({ message: `Can't find forum with slug ${slug}` })
        } else {
            return res.code(200).send(ModelForum.serialize(forum));
        }
    }

    async createThread(req: any, res: any) {
        const thread = new ModelThread(req.body);
        const slug = req.params.slug;
        const author = thread.attrs.author;

        if (thread.attrs.created) {
            if ((typeof thread.attrs.created === "object"))  {
                thread.attrs.created = new Date();
            }
        }

        if (isId(slug)) {
            return res.code(400).send({ message: "Slug can not contain only digits " });
        }

        const userData: any = await UserRepository.getByNickname(author);

        if (!userData) {
            return res.code(404).send({ message: `Can't find user with nickname ${author}` });
        }

        const user = new ModelUser(userData);
        let dbThread = ThreadRepository.getThread('slug', thread.attrs.slug);
        let forum: any = ForumRepository.getBySlug(slug);

        Promise.all([dbThread, forum]).then( async (result: any[]) => {
           dbThread = result[0];
           forum = result[1];

            if (dbThread) {
                return res.code(409).send(ModelThread.serialize(dbThread));
            }

            if (!forum) {
                return res.code(404).send({ message: `Can't find forum with slug ${slug}` });
            }

            forum = new ModelForum(forum);
            const data = await ThreadRepository.createThread(thread, forum, user);

            if (data.attrs.status === 201) {
                if (!thread.attrs.slug) {
                    delete data.attrs.body.slug;
                }

                return res.code(201).send(ModelThread.serialize(data.attrs.body));
            } else {
                return res.code(500).send(data.attrs.body);
            }
        });
    }

    async getForumThreads(req: any, res: any) {
        const slug = req.params.slug;
        const params = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? Number(req.query.limit) : 100,
            since : req.query.since,
        };

        const forum = await ForumRepository.getBySlug(slug);

        if (!forum) {
            return res.code(404).send({ message: `Can't find forum with slug ${slug}` })
        }

        const threads: any[] = await ThreadRepository.getForumThread(params, forum.slug);
        return res.code(200).send(threads.map((item) => ModelThread.serialize(item)));
    }

    async getForumUsers(req: any, res: any) {
        const slug = req.params.slug;
        const params = {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? Number(req.query.limit) : 100,
            since : req.query.since,
        };

        const forum = await ForumRepository.getBySlug(slug);

        if (!forum) {
            return res.code(404).send({ message: `Can't find forum with slug ${slug}` })
        }

        const users = await UserRepository.getUsersFromForum(forum.slug, params);
        return res
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(users);
    }

}
