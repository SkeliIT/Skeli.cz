package com.github.skeliit.dao;

import com.github.skeliit.model.FeedItem;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FeedDaoTest {

    private static FeedItem item(String id, String published) {
        Instant p = published == null ? null : Instant.parse(published);
        return new FeedItem(id, id, "https://skeli.cz/", null, null, p, p, "video", null);
    }

    @Test
    void newestFirstPutsUndatedLastAndCuts() {
        List<FeedItem> items = new ArrayList<>(List.of(
                item("old", "2024-01-01T00:00:00Z"),
                item("none", null),
                item("new", "2026-01-01T00:00:00Z"),
                item("mid", "2025-01-01T00:00:00Z")));
        List<FeedItem> out = FeedDao.newestFirst(items, 3);
        assertEquals(List.of("new", "mid", "old"), out.stream().map(FeedItem::id).toList());
    }

    @Test
    void socialTitleUsesFirstCaptionLine() {
        assertEquals("Nový klip venku!", FeedDao.socialTitle("  Nový klip venku!\nodkaz v bio", "instagram"));
        assertEquals("Instagram", FeedDao.socialTitle(null, "instagram"));
        assertEquals("Facebook", FeedDao.socialTitle("   \n ", "facebook"));
        String long_ = "slovo ".repeat(30);
        String t = FeedDao.socialTitle(long_, "instagram");
        assertTrue(t.endsWith("…") && t.length() <= 91, t);
    }

    @Test
    void videoTitleDropsShortTags() {
        assertEquals("Hudba je má múza (ft. Zoom)",
                FeedDao.videoTitle("Hudba je má múza SHORT #music #hiphop #newmusic (ft. Zoom)", true));
        assertEquals("Tak blízko", FeedDao.videoTitle("Tak blízko - SHORT #music #hiphop #newmusic #rap", true));
        assertEquals("Tisíc kousků", FeedDao.videoTitle("Skeli - Tisíc kousků [Official video]", false));
        assertEquals("rap", FeedDao.videoTitle("#rap", false)); // display() úvodní symboly zahodí samo
        assertNull(FeedDao.videoTitle(null, true));
        assertEquals("Já už vím", FeedDao.videoTitle("Já už vím Short", true));
        assertEquals("Short story", FeedDao.videoTitle("Short story", false));
    }
}
