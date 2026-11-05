package com.github.skeliit.service;

import com.github.skeliit.Config;
import jakarta.servlet.ServletContext;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.regex.Pattern;

/**
 * Obrázky uživatelů: profilová fotka a záhlaví. Každé nahrání dostane náhodný název, takže se soubor nedá
 * najít zkoušením čísel. Leží v UPLOAD_DIR/avatars|covers, když je UPLOAD_DIR nastavený, jinak uvnitř aplikace;
 * obojí přežije nasazení. Vydává je web/files/ProfileImageServlet.
 */
public final class ProfileImages {
    private ProfileImages() {}

    public enum Kind {
        AVATAR("avatars", "avatar_url"), COVER("covers", "cover_url");

        final String folder;
        /** Sloupec v tabulce users (pevná hodnota, ne vstup od uživatele). */
        public final String column;

        Kind(String folder, String column) { this.folder = folder; this.column = column; }

        public String prefix() { return "/uploads/" + folder + "/"; }
    }

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern RANDOM_NAME = Pattern.compile("[a-f0-9]{32}\\.(jpg|png|gif)");
    /** Názvy, které se kdy ukládaly (staré = číslo uživatele); nic jiného se z disku nečte ani nemaže. */
    private static final Pattern ANY_NAME = Pattern.compile("[A-Za-z0-9_-]+\\.(jpg|png|gif)");

    public static File dir(ServletContext ctx, Kind kind) {
        String uploadDir = Config.get("UPLOAD_DIR");
        if (uploadDir != null && !uploadDir.isBlank()) return new File(uploadDir, kind.folder);
        String base = ctx.getRealPath("/uploads/" + kind.folder);
        return base != null ? new File(base) : new File(System.getProperty("java.io.tmpdir"), kind.folder);
    }

    /** Je to název, který se smí vydat? Starý název podle čísla uživatele ne. */
    public static boolean isRandomName(String name) {
        return name != null && RANDOM_NAME.matcher(name).matches();
    }

    /** Nový náhodný název; přípona se zachová (u starých PNG a GIF). */
    public static String randomName(String extension) {
        byte[] b = new byte[16];
        RANDOM.nextBytes(b);
        return HexFormat.of().formatHex(b) + "." + extension;
    }

    /** Název souboru z adresy obrázku (bez ?v=…), nebo null, když adresa nevede na náš soubor (třeba fotka z Googlu). */
    public static String nameOf(Kind kind, String url) {
        if (url == null || !url.startsWith(kind.prefix())) return null;
        String name = url.substring(kind.prefix().length()).replaceAll("\\?.*$", "");
        return ANY_NAME.matcher(name).matches() ? name : null;
    }

    /** Vede adresa na soubor se starým názvem podle čísla (nebo se starým ?v=)? */
    public static boolean isOldUrl(Kind kind, String url) {
        String name = nameOf(kind, url);
        return name != null && (!isRandomName(name) || !url.equals(kind.prefix() + name));
    }

    /** Uloží obrázek jako JPEG pod novým náhodným názvem a vrátí jeho adresu. */
    public static String store(ServletContext ctx, Kind kind, BufferedImage image, float quality) throws IOException {
        File dir = dir(ctx, kind);
        dir.mkdirs();
        String name = randomName("jpg");
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);
        try (FileImageOutputStream out = new FileImageOutputStream(new File(dir, name))) {
            writer.setOutput(out);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return kind.prefix() + name;
    }

    /** Smaže soubor patřící k adrese; cizí adresy (Google, výchozí obrázek) nechá být. */
    public static void delete(ServletContext ctx, Kind kind, String url) {
        String name = nameOf(kind, url);
        if (name == null) return;
        File f = new File(dir(ctx, kind), name);
        if (f.isFile() && !f.delete()) ctx.log("Obrázek uživatele nejde smazat: " + f);
    }
}
