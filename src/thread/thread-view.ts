import { Response } from "../response/response";
import ThreadRepository from './thread-repository';
import UserRepository from '../user/user-repository';
import PostRepository from '../post/post-repository';
import ForumRepository from '../forum/forum-repository';
import { ModelPost } from "../post/post-model";
import { isId } from "../utils/utils";
import { ModelThread } from "./thread-model";
import { ModelUser } from "../user/user-model";

export default new class ThreadView {
    async createPost(req: any, res: any) {
        const posts  = req.body;

        const type = isId(req.params.slug) ? 'id' : 'slug';
        const value = isId(req.params.slug) ? Number(req.params.slug) : req.params.slug;

        let thread: any | ModelThread = await ThreadRepository.getThread(type, value);

        if (!thread) {
            return res.code(404).send({ message: `Can't find forum with slug or id ${req.params.slug}`});
        }

        thread = new ModelThread(thread);

        if (Array.isArray(posts) && !posts.length) {
            return res.code(201).send(posts);
        }
        //
        // const users: ModelUser[] = [];
        //
        // for (const post of posts) {
        //     const user: any = await UserRepository.getByNickname(post.author);
        //
        //     if (!user) {
        //         return res.code(404).send({ message: `Can't find user with nickname ${post.author}` });
        //     }
        //
        //
        //     users.push(new ModelUser(user));
        // }

        const resultPost = await PostRepository.createPost(posts, thread);

        if (resultPost.attrs.status === 409) {
            return res.code(409).send({ message: resultPost.attrs.body  });
        } else if (resultPost.attrs.status === 404) {
            return res.code(404).send({ message: "Can't find post author by nickname" })
        }

        return res.code(201).send(resultPost.attrs.body.map((item: any) => ModelPost.serialize(item)))
    }

    async voteToThread(req: any, res: any) {
        const vote = req.body;

        const type = isId(req.params.slug) ? 'id' : 'slug';
        const value = isId(req.params.slug) ? Number(req.params.slug) : req.params.slug;


        const voteResult = await ThreadRepository.createVote(vote.voice, vote.nickname, type, value);

        if (voteResult.attrs.status !== 200) {
            return res.code(404).send({ message: voteResult.attrs.body })
        }

        return res.code(200).send(voteResult.attrs.body);
    }

    async getDetails(req: any, res: any) {
        const type = isId(req.params.slug) ? 'id' : 'slug';
        const value = isId(req.params.slug) ? Number(req.params.slug) : req.params.slug;

        let thread: any = await ThreadRepository.getThread(type, value);

        if (!thread) {
            return res.code(404).send({ message: `Can't find forum with slug or id ${req.params.slug}`});
        } else {
            return res.code(200).send(ModelThread.serialize(thread));
        }
    }

    async updateThread(req: any, res: any) {
        const type = isId(req.params.slug) ? 'id' : 'slug';
        const value = isId(req.params.slug) ? Number(req.params.slug) : req.params.slug;

        let thread: any = await ThreadRepository.getThread(type, value);

        if (!thread) {
            return res.code(404).send({ message: `Can't find forum with slug or id ${req.params.slug}`});
        }

        const updateThread = await ThreadRepository.updateThread(thread.id, new ModelThread(req.body));

        const result = updateThread === true ? thread : updateThread;

        return res.code(200).send(ModelThread.serialize(result));
    }

    async getThreadsPost(req: any, res: any) {
        const type = isId(req.params.slug) ? 'id' : 'slug';
        const value = isId(req.params.slug) ? Number(req.params.slug) : req.params.slug;

        let thread: any = await ThreadRepository.getThread(type, value);

        if (!thread) {
            return res.code(404).send({ message: `Can't find forum with slug or id ${req.params.slug}`});
        }

        const posts: any[] = await PostRepository.getPostByThreadId(req.query.sort, thread.id, {
            desc : req.query.desc === 'true',
            limit : req.query.limit ? parseInt(req.query.limit) : 100,
            since : req.query.since,
        });

        return res.code(200).send(posts.map((item) => ModelPost.serialize(item)));
    }

}
