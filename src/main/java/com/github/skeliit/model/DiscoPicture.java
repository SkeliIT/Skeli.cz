package com.github.skeliit.model;

/**
 * Admin → Obrázky v Diskografii: jedna karta písně tak, jak ji vidí návštěvník na Hudbě
 * (obrázek, jeho posun a zvětšení z adminu) a odkaz na úpravu.
 */
public class DiscoPicture {
    public int id;
    public String name;
    public Integer year;
    public String src;        // obrázek na kartě (null = bez obrázku)
    public String style = ""; // CSS proměnné posunu a zvětšení (--px, --py, --pz), "" = střed bez zvětšení
    public boolean own;       // obrázek vybraný v adminu (ne automatický)
    public boolean collab;

    public int getId() { return id; }
    public String getName() { return name; }
    public Integer getYear() { return year; }
    public String getSrc() { return src; }
    public String getStyle() { return style; }
    public boolean isOwn() { return own; }
    public boolean isPlaced() { return !style.isEmpty(); }
    public boolean isCollab() { return collab; }
}
