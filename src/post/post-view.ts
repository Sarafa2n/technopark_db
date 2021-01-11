import { ModelPost } from "./post-model";
import UserRepository from '../user/user-repository';
import ForumRepository from '../forum/forum-repository';
import ThreadRepository from '../thread/thread-repository';
import PostRepository from './post-repository';
import { ModelThread } from "../thread/thread-model";
import { ModelForum } from "../forum/forum-model";

export default new class PostView {

    async getDetails(req: any, res: any) {
        const post = await PostRepository.getPostById(req.params.id);

        if (!post) {
            return res.code(404).send({ message: `Can't find post with id ${req.params.id}` });
        }

        let result: any = {};

        result.post = ModelPost.serialize(post);

        if (req.query.related) {
            const relatedArray = req.query.related.split(',');

            if (relatedArray.includes('user')) {
                result.author = await UserRepository.getByNickname(post.author);
            }

            if (relatedArray.includes('thread')) {
                result.thread = ModelThread.serialize(await ThreadRepository.getThread('id', post.thread_id));
            }

            if (relatedArray.includes('forum')) {
                result.forum = ModelForum.serialize(await ForumRepository.getBySlug(post.forum_slug));
            }
        }

        return res.code(200).send(result);
    }

    async updatePost(req: any, res: any) {
        const id = Number(req.params.id);
        const post = await PostRepository.getPostById(id);
        const message = req.body.message;

        if (!post) {
            return res.code(404).send({ message: `Can't find post with id ${id}` });
        }

        if (!message || message === post.message) {
            return res.code(200).send(ModelPost.serialize(post));
        }

        const updatePost = await PostRepository.updatePost(new ModelPost({ id, ...req.body }));

        return res.code(updatePost.attrs.status).send(updatePost.attrs.body);
    }
}

