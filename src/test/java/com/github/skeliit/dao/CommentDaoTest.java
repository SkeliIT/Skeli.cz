package com.github.skeliit.dao;

import com.github.skeliit.dao.CommentDao.Kind;
import com.github.skeliit.dao.CommentDao.Sort;
import com.github.skeliit.model.CommentItem;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CommentDaoTest {

    private static CommentItem c(int id, Integer parent, int up, boolean pinned) {
        CommentItem it = new CommentItem();
        it.id = id;
        it.parentId = parent;
        it.up = up;
        it.pinned = pinned;
        return it;
    }

    private static List<Integer> ids(List<CommentItem> items) {
        return items.stream().map(it -> it.id).toList();
    }

    @Test
    void repliesGoUnderTheirCommentOldestFirst() {
        // the database gives them oldest first
        List<CommentItem> rows = new ArrayList<>(List.of(c(1, null, 0, false), c(2, 99, 0, false), c(3, 1, 0, false),
                c(4, null, 0, false), c(5, 1, 0, false)));
        List<CommentItem> threads = CommentDao.nest(rows, Sort.NEW);
        assertEquals(List.of(4, 1), ids(threads), "newest first; a reply to a missing comment is dropped");
        assertEquals(List.of(3, 5), ids(threads.get(1).replies));
        assertTrue(threads.get(0).replies.isEmpty());
    }

    @Test
    void topPutsLikedCommentsFirstAndThePinnedOneAboveAll() {
        List<CommentItem> rows = new ArrayList<>(List.of(c(1, null, 5, false), c(2, null, 0, true), c(3, null, 9, false),
                c(4, null, 0, false)));
        assertEquals(List.of(2, 3, 1, 4), ids(CommentDao.nest(new ArrayList<>(rows), Sort.TOP)));
        assertEquals(List.of(2, 4, 3, 1), ids(CommentDao.nest(new ArrayList<>(rows), Sort.NEW)), "pinned stays on top");
    }

    @Test
    void targetsAreChecked() {
        assertTrue(Kind.LYRIC.validTarget("12"));
        assertFalse(Kind.LYRIC.validTarget("12 OR 1=1"));
        assertTrue(Kind.VIDEO.validTarget("pZx0xa6MpbE"));
        assertFalse(Kind.VIDEO.validTarget("<script>"));
        assertNull(Kind.of("comments"));
        assertEquals(Kind.VIDEO, Kind.of("video"));
    }
}
