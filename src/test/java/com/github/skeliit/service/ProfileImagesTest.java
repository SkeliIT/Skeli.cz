package com.github.skeliit.service;

import com.github.skeliit.service.ProfileImages.Kind;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Názvy obrázků uživatelů: nové jsou náhodné, staré podle čísla se poznají a nic mimo složku se nepřečte. */
class ProfileImagesTest {

    @Test
    void newNamesAreRandomAndValid() {
        String a = ProfileImages.randomName("jpg"), b = ProfileImages.randomName("jpg");
        assertNotEquals(a, b);
        assertTrue(ProfileImages.isRandomName(a), a);
    }

    @Test
    void numberNamesAreNotServed() {
        assertFalse(ProfileImages.isRandomName("1.jpg"));
        assertFalse(ProfileImages.isRandomName("../../.env"));
        assertFalse(ProfileImages.isRandomName(null));
    }

    @Test
    void oldAddressesAreRecognised() {
        String fresh = Kind.COVER.prefix() + ProfileImages.randomName("jpg");
        assertTrue(ProfileImages.isOldUrl(Kind.AVATAR, "/uploads/avatars/5.jpg"));
        assertTrue(ProfileImages.isOldUrl(Kind.COVER, "/uploads/covers/5.jpg?v=123"));
        assertTrue(ProfileImages.isOldUrl(Kind.COVER, fresh + "?v=123"));
        assertFalse(ProfileImages.isOldUrl(Kind.COVER, fresh));
        assertFalse(ProfileImages.isOldUrl(Kind.AVATAR, "https://lh3.googleusercontent.com/a/x"));
        assertFalse(ProfileImages.isOldUrl(Kind.AVATAR, null));
    }

    @Test
    void onlyOurFilesHaveAName() {
        assertEquals("5.jpg", ProfileImages.nameOf(Kind.AVATAR, "/uploads/avatars/5.jpg?v=1"));
        assertNull(ProfileImages.nameOf(Kind.AVATAR, "/uploads/avatars/../../.env"));
        assertNull(ProfileImages.nameOf(Kind.AVATAR, "/img/avatar-default.svg"));
        assertNull(ProfileImages.nameOf(Kind.AVATAR, "https://evil.example/uploads/avatars/5.jpg"));
    }
}
