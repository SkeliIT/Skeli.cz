package com.github.skeliit.model;

/** What a user filled in on the settings page (user_profiles); any field may be empty. */
public class UserProfile {
    public final String displayName;
    public final Integer age;
    public final String city;
    public final String bio;
    public final String theme;
    public final String lang;

    public UserProfile(String displayName, Integer age, String city, String bio, String theme, String lang) {
        this.displayName = displayName;
        this.age = age;
        this.city = city;
        this.bio = bio;
        this.theme = theme;
        this.lang = lang;
    }
}
