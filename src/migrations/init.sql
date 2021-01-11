CREATE EXTENSION IF NOT EXISTS CITEXT;

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS forums CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS forum_users CASCADE;

CREATE UNLOGGED TABLE IF NOT EXISTS users (
     id       SERIAL         UNIQUE NOT NULL,
     nickname CITEXT  NOT NULL PRIMARY KEY,
     email    CITEXT         NOT NULL UNIQUE,
     fullname CITEXT         NOT NULL,
     about    TEXT           NOT NULL
);

CREATE UNLOGGED TABLE IF NOT EXISTS forums (
    id      SERIAL,
    slug    CITEXT PRIMARY KEY,
    posts   INT    NOT NULL DEFAULT 0,
    threads INT       NOT NULL DEFAULT 0,
    title   TEXT      NOT NULL,
    nickname CITEXT REFERENCES users (nickname)
);

CREATE UNLOGGED TABLE IF NOT EXISTS threads (
    id         SERIAL PRIMARY KEY ,
    author    CITEXT        NOT NULL REFERENCES users(nickname),
    author_id INT NOT NULL references users(id),
    created   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    forum     CITEXT        NOT NULL REFERENCES forums(slug),
    message   TEXT        NOT NULL,
    slug      CITEXT      UNIQUE,
    title     TEXT        NOT NULL,
    votes     INT         NOT NULL DEFAULT 0
);

CREATE UNLOGGED TABLE posts (
    id SERIAL PRIMARY KEY ,
    path INTEGER ARRAY,
    author CITEXT NOT NULL REFERENCES users(nickname),
    author_id INT NOT NULL REFERENCES  users(id),
    created TIMESTAMP WITH TIME ZONE DEFAULT now(),
    edited BOOLEAN DEFAULT FALSE,
    message TEXT  NOT NULL,
    parent_id INTEGER,
    forum_slug CITEXT NOT NULL,
    thread_id INTEGER NOT NULL
);

CREATE UNLOGGED TABLE forum_users (
    user_id INT REFERENCES users(id),
    forum_slug CITEXT REFERENCES forums(slug)
);

CREATE UNLOGGED TABLE IF NOT EXISTS votes (
    nickname        CITEXT      NOT NULL REFERENCES users(nickname),
    thread          BIGINT      NOT NULL REFERENCES threads(id),
    voice           INTEGER     DEFAULT 0,
    CONSTRAINT unique_vote UNIQUE(nickname, thread)
);


CREATE UNIQUE INDEX idx_forums_id ON forums(id);
CREATE UNIQUE INDEX idx_forums_slug_id ON forums(slug, id);
CREATE UNIQUE INDEX idx_forums_id_slug ON forums(id, slug);
CREATE INDEX idx_forums_slug on forums USING hash(slug);

CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_users_nickname ON users USING hash(nickname);

CREATE INDEX idx_thread_id ON threads USING hash(slug);
CREATE INDEX idx_threads_created ON threads(created);
CREATE INDEX idx_threads_slug_id ON threads(slug, id);
CREATE INDEX idx_threads_id_slug ON threads(id, slug);
CREATE INDEX idx_threads_forum_created ON threads(forum, created);

CREATE INDEX ON posts (thread_id);
CREATE INDEX ON posts (path, created, id);
CREATE INDEX ON posts (path);
CREATE INDEX ON posts (thread_id, path);
CREATE INDEX ON posts (thread_id, array_length(path, 1))
    WHERE array_length(path, 1) = 1;
CREATE INDEX ON posts ((path[1]));
CREATE INDEX ON posts ((path[1]), (path[2:]), created, id);
CREATE INDEX ON posts (thread_id, array_length(path, 1), (path[1]))
    WHERE array_length(path, 1) = 1;
CREATE INDEX ON posts (created, id);
CREATE INDEX ON posts (thread_id, id);

CREATE UNIQUE INDEX idx_forum_users_slug ON forum_users(forum_slug, user_id);

ALTER TABLE ONLY votes ADD CONSTRAINT votes_user_thread_unique UNIQUE (nickname, thread);

CREATE OR REPLACE FUNCTION vote_insert()
    RETURNS TRIGGER AS $vote_insert$
BEGIN
    UPDATE threads
    SET votes = votes + NEW.voice
    WHERE id = NEW.thread;
    RETURN NULL;
END;
$vote_insert$  LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vote_insert ON votes;
CREATE TRIGGER vote_insert AFTER INSERT ON votes FOR EACH ROW EXECUTE PROCEDURE vote_insert();

CREATE FUNCTION trigger_vote_after_update()
    RETURNS trigger AS $trigger_vote_after_update$
BEGIN
    IF OLD.voice != NEW.voice THEN
        UPDATE threads SET votes = votes - OLD.voice + NEW.voice WHERE threads.id = NEW.thread;
    END IF;
    RETURN OLD;
END;
$trigger_vote_after_update$ LANGUAGE plpgsql;

CREATE TRIGGER after_update AFTER UPDATE
    ON votes
    FOR EACH ROW
EXECUTE PROCEDURE trigger_vote_after_update();

CREATE OR REPLACE FUNCTION trigger_post_after_insert()
    RETURNS trigger AS $trigger_post_after_insert$
BEGIN
    UPDATE forums SET posts = posts + 1 WHERE forums.slug = NEW.forum_slug;
    INSERT INTO forum_users (forum_slug, user_id) VALUES (NEW.forum_slug, NEW.author_id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$trigger_post_after_insert$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_insert ON posts;
CREATE TRIGGER after_insert AFTER INSERT
    ON posts
    FOR EACH ROW
EXECUTE PROCEDURE trigger_post_after_insert();


CREATE OR REPLACE FUNCTION threads_forum_counter()
  RETURNS TRIGGER AS $threads_forum_counter$
    BEGIN
      UPDATE forums SET threads = threads + 1 WHERE slug = NEW.forum;
      INSERT INTO forum_users (forum_slug, user_id) VALUES (NEW.forum, NEW.author_id) ON CONFLICT DO NOTHING;
      RETURN NEW;
    END;
$threads_forum_counter$  LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS threads_forum_counter ON threads;
CREATE TRIGGER threads_forum_counter AFTER INSERT ON threads FOR EACH ROW EXECUTE PROCEDURE threads_forum_counter();

CREATE OR REPLACE FUNCTION path() RETURNS TRIGGER AS $path$
DECLARE
    parent_path INT[];
    parent_thread_id INT;
BEGIN
    IF (NEW.parent_id is null ) THEN
        NEW.path := NEW.path || NEW.id;
    ELSE
        SELECT path, thread_id FROM posts
        WHERE id = NEW.parent_id  INTO parent_path, parent_thread_id;
        IF parent_thread_id != NEW.thread_id THEN
            raise exception 'invalid_parent_id' using errcode = '00409';
        end if;
        NEW.path := NEW.path || parent_path || NEW.id;
    END IF;

    RETURN NEW;
END;

$path$ LANGUAGE  plpgsql;


DROP TRIGGER IF EXISTS path_trigger ON posts;
CREATE TRIGGER path_trigger BEFORE INSERT ON posts FOR EACH ROW EXECUTE PROCEDURE path();
