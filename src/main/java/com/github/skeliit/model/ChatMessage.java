package com.github.skeliit.model;

/** Jedna zpráva v chatu, jak ji vidí přihlášený. Veřejná pole: posílá se jako JSON. Smazaná zpráva text nemá. */
public class ChatMessage {
    public long id;
    public boolean mine;
    public String body;
    public long at;             // epoch ms; čas napíše prohlížeč v jazyce návštěvníka
    public boolean deleted;
}
