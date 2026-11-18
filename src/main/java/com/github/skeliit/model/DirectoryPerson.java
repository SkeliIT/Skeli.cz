package com.github.skeliit.model;

/** Člověk na stránce Lidé. Obyčejná třída, překladač JSP neumí record. */
public class DirectoryPerson {
    public String username;
    public String avatarUrl;
    /** Má veřejný profil? Jen pak na něj vede odkaz. */
    public boolean pub;
    /** Je právě na webu; true jen u toho, kdo si stav online zapnul. */
    public boolean online;
    /** none, sent, received, friends. */
    public String rel = "none";
}
