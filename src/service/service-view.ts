import UserRepository from '../user/user-repository';
import ThreadRepository from '../thread/thread-repository';
import ForumRepository from '../forum/forum-repository';
import PostRepository from '../post/post-repository';

export default new class ServiceView {
    async status(req: any, res: any) {
        const forum = await ForumRepository.getCount();
        const user = await UserRepository.getCount();
        const thread = await ThreadRepository.getCount();
        const post = await PostRepository.getCount();

        return res.code(200).send({ forum, user, thread, post });
    }

    async delete(req: any, res: any) {
        await ForumRepository.clearAll();
        await UserRepository.clearAll();
        await ThreadRepository.clearAll();
        await PostRepository.clearAll();

        return res.code(200).send(null);
    }
}
