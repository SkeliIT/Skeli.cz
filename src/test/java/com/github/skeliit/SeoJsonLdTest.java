package com.github.skeliit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SeoJsonLdTest {

    private static final String BASE = "https://www.skeli.cz";

    @Test
    void homePageDescribesTheSiteAndTheArtist() throws Exception {
        JsonNode graph = new ObjectMapper().readTree(
                SeoJsonLd.forPage(BASE, BASE + "/", "/", "website", null, null, "cs", "Domů", "Texty")).get("@graph");
        assertEquals("WebSite", graph.get(0).get("@type").asText());
        assertEquals("MusicGroup", graph.get(1).get("@type").asText());
        assertEquals("Skeli", graph.get(1).get("name").asText());
        assertTrue(graph.get(1).get("sameAs").toString().contains("open.spotify.com"));
    }

    @Test
    void lyricPageIsASongWithABreadcrumb() throws Exception {
        String json = SeoJsonLd.forPage(BASE, BASE + "/cs/song/tisic-kousku", null, "music.song", "Tisíc \"kousků\" </script>",
                "https://i.ytimg.com/vi/x/hqdefault.jpg", "cs", "Domů", "Texty");
        assertFalse(json.contains("</script>"), "the name can't end the script element");
        JsonNode graph = new ObjectMapper().readTree(json).get("@graph");
        assertEquals("MusicRecording", graph.get(1).get("@type").asText());
        assertEquals("Tisíc \"kousků\" </script>", graph.get(1).get("name").asText());
        assertEquals(3, graph.get(2).get("itemListElement").size());
    }

    @Test
    void otherPagesGetNone() {
        assertNull(SeoJsonLd.forPage(BASE, BASE + "/privacy.jsp", "/privacy.jsp", "website", null, null, "cs", "Domů", "Texty"));
        assertNull(SeoJsonLd.forPage(BASE, BASE + "/x", null, "website", null, null, "cs", "Domů", "Texty"));
    }
}
