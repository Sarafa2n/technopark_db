import fastify from "fastify";

import { RouterStore } from "./store/route";
import UserView from "./user/user-view";
import ForumView from './forum/forum-view';
import ThreadView from './thread/thread-view';
import PostView from './post/post-view';
import ServiceView from './service/service-view';
import fs from "fs";
import path from "path";

const morgan = require('morgan');

const app: any = fastify({
    ignoreTrailingSlash: true,
    caseSensitive: false,
});


app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req: any, body: string, done: any) {
    try {
        let json = {};
        if (body){
            json = JSON.parse(body)
        }
        done(null, json)
    } catch (err) {
        err.statusCode = 400;
        done(err, undefined)
    }
});

app.get('/api', (req: any, res: any) => {
    return res.code(404).send(null);
});
app.post(RouterStore.api.post.forum.create, ForumView.createForum);
app.post(RouterStore.api.post.forum.createThread, ForumView.createThread);
app.get(RouterStore.api.get.forum.details, ForumView.getForumDetails);
app.get(RouterStore.api.get.forum.users, ForumView.getForumUsers);
app.get(RouterStore.api.get.forum.threads, ForumView.getForumThreads);

app.post(RouterStore.api.post.user.create, UserView.createUser);
app.post(RouterStore.api.get.user.profile, UserView.updateUser);
app.get(RouterStore.api.get.user.profile, UserView.get);

app.post(RouterStore.api.post.thread.create, ThreadView.createPost);
app.post(RouterStore.api.post.thread.update, ThreadView.updateThread);
app.post(RouterStore.api.post.thread.vote, ThreadView.voteToThread);
app.get(RouterStore.api.get.thread.details, ThreadView.getDetails);
app.get(RouterStore.api.get.thread.posts, ThreadView.getThreadsPost);

app.post(RouterStore.api.post.post.update, PostView.updatePost);
app.get(RouterStore.api.get.post.threads, PostView.getDetails);

app.post(RouterStore.api.post.service, ServiceView.delete);
app.get(RouterStore.api.get.service, ServiceView.status);

// app.register(require('middie')).then(() => {
//     const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
//     app.use(morgan('dev', { stream: accessLogStream }));
//     app.listen(5000, '0.0.0.0', () => {
//         return console.log(`server is listening on localhost: 8090`);
//     });
// });

app.listen(5000, '0.0.0.0', () => {
    return console.log(`server is listening on localhost: 8090`);
});
