package com.github.skeliit.model;

/**
 * Admin → Obrázky písní: jedna píseň tak, jak ji vidí návštěvník na Hudbě (karta), v Textech (řádek)
 * a v Karaoke (kulatá ikonka): obrázek, jeho posun a zvětšení z adminu a odkaz na úpravu.
 */
public class DiscoPicture {
    public int id;
    public String name;
    public Integer year;
    public String src;        // obrázek na kartě (null = bez obrázku)
    public String style = ""; // CSS proměnné posunu a zvětšení (--px, --py, --pz), "" = střed bez zvětšení
    public boolean own;       // obrázek vybraný v adminu (ne automatický)
    public boolean collab;
    public String uuid;
    public String textySrc;         // obrázek řádku v Textech (null = píseň v Textech není nebo nemá obrázek)
    public String textyStyle = "";  // posun řádku (--tx, --py, --az), "" = automaticky
    public boolean inTexty;         // píseň má text, takže je v seznamu Texty
    public String karSrc;           // obrázek kulaté ikonky v Karaoke (null = píseň v Karaoke není)
    public String karStyle = "";    // posun ikonky (stejný jako karta), jen u hlavního obrázku
    public boolean karMain;         // ikonka bere hlavní obrázek (jinak náhled klipu)

    public int getId() { return id; }
    public String getName() { return name; }
    public Integer getYear() { return year; }
    public String getSrc() { return src; }
    public String getStyle() { return style; }
    public boolean isOwn() { return own; }
    public boolean isPlaced() { return !style.isEmpty(); }
    public boolean isCollab() { return collab; }
    public String getUuid() { return uuid; }
    public String getTextySrc() { return textySrc; }
    public String getTextyStyle() { return textyStyle; }
    public boolean isTextyPlaced() { return !textyStyle.isEmpty(); }
    public boolean isInTexty() { return inTexty; }
    public String getKarSrc() { return karSrc; }
    public String getKarStyle() { return karStyle; }
    public boolean isKarMain() { return karMain; }
    /** něco je nastavené ručně (hlavní obrázek nebo posun na některém místě) */
    public boolean isManual() { return own || isPlaced() || isTextyPlaced(); }
}
