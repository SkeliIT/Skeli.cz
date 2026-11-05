package com.github.skeliit.job;

import com.github.skeliit.Db;
import com.github.skeliit.service.ProfileImages;
import com.github.skeliit.service.ProfileImages.Kind;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Při startu webu přejmenuje obrázky se starým názvem podle čísla uživatele (šlo je najít zkoušením čísel)
 * na náhodné a opraví jejich adresu v databázi. Když už není co dělat, nedělá nic.
 * Soubor, na který nic nevede (po dřívějším smazání účtu adminem), nechá ležet: web ho stejně nevydá.
 */
@WebListener
public class ProfileImageNames implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext ctx = sce.getServletContext();
        for (Kind kind : Kind.values()) {
            try {
                int renamed = rename(ctx, kind);
                if (renamed > 0) ctx.log("Obrázky uživatelů (" + kind + "): přejmenováno " + renamed);
            } catch (SQLException | IOException e) {
                ctx.log("Obrázky uživatelů (" + kind + "): přejmenování se nepovedlo", e);
            }
        }
    }

    private static int rename(ServletContext ctx, Kind kind) throws SQLException, IOException {
        File dir = ProfileImages.dir(ctx, kind);
        try (Connection c = Db.get()) {
            List<String> urls = new ArrayList<>();
            try (PreparedStatement ps = c.prepareStatement("SELECT DISTINCT " + kind.column + " FROM users WHERE " + kind.column + " LIKE ?")) {
                ps.setString(1, kind.prefix() + "%");
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) if (ProfileImages.isOldUrl(kind, rs.getString(1))) urls.add(rs.getString(1));
                }
            }
            Map<String, String> newNames = new HashMap<>();   // víc adres může vést na tentýž soubor (různé ?v=)
            int renamed = 0;
            for (String url : urls) {
                String old = ProfileImages.nameOf(kind, url);
                String name = newNames.get(old);
                if (name == null) {
                    File from = new File(dir, old);
                    if (!from.isFile()) continue;              // soubor chybí: není co přejmenovat
                    name = ProfileImages.isRandomName(old) ? old : ProfileImages.randomName(old.substring(old.lastIndexOf('.') + 1));
                    if (!name.equals(old)) Files.move(from.toPath(), new File(dir, name).toPath());
                    newNames.put(old, name);
                    renamed++;
                }
                String newUrl = kind.prefix() + name;
                try (PreparedStatement ps = c.prepareStatement("UPDATE users SET " + kind.column + " = ? WHERE " + kind.column + " = ?")) {
                    ps.setString(1, newUrl);
                    ps.setString(2, url);
                    ps.executeUpdate();
                }
                if (kind == Kind.AVATAR) {
                    try (PreparedStatement ps = c.prepareStatement("UPDATE user_profiles SET avatar_url = ? WHERE avatar_url = ?")) {
                        ps.setString(1, newUrl);
                        ps.setString(2, url);
                        ps.executeUpdate();
                    }
                }
            }
            return renamed;
        }
    }
}
