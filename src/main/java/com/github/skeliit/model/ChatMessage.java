package com.github.skeliit.model;

import java.util.ArrayList;
import java.util.List;

/** Jedna zpráva v chatu, jak ji vidí přihlášený. Veřejná pole: posílá se jako JSON. Smazaná zpráva text nemá. */
public class ChatMessage {
    /** Reakce na zprávu: smajlík, kolik lidí ji dalo a jestli i já. */
    public static class Reaction {
        public String e;
        public int n;
        public boolean mine;
    }

    public long id;
    public boolean mine;
    public String body;
    public long at;             // epoch ms; čas napíše prohlížeč v jazyce návštěvníka
    public boolean deleted;
    public boolean edited;
    public String embedKind;    // známý odkaz ve zprávě: youtube, spotify, apple, soundcloud; null = žádný
    public String embedId;      // jen ověřená část odkazu (service/MusicLinks), adresu skládá prohlížeč
    public Long replyTo;        // na kterou zprávu odpovídá; null = na žádnou
    public String replyBody;    // začátek té zprávy; prázdný = byla smazaná
    public boolean replyMine;
    public List<Reaction> reactions = new ArrayList<>();
}
