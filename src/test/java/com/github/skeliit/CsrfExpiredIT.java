package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import static org.junit.jupiter.api.Assertions.*;

/** Formulář otevřený tak dlouho, že mezitím vypršela relace: místo holé chyby zpátky na stránku s hláškou. */
class CsrfExpiredIT extends UiTestSupport {

    @Test
    @DisplayName("Přihlášení po vypršení relace vrátí na přihlašovací stránku s hláškou „zkus to znovu“ a pak už jde přihlásit")
    void prihlaseniPoVyprseni() throws Exception {
        String name = "cx" + uniq();
        registerAndLogin(name);
        logout();
        driver.get(BASE_URL + "/login.jsp");
        driver.manage().deleteCookieNamed("JSESSIONID");   // relace vypršela, stránka zůstala otevřená
        driver.findElement(By.name("username")).sendKeys(name);
        driver.findElement(By.name("password")).sendKeys(PASSWORD);
        submit(By.cssSelector("form[action$='login'] button[type=submit]"));
        assertTrue(driver.getCurrentUrl().contains("/login.jsp") && driver.getCurrentUrl().contains("csrf=expired"), driver.getCurrentUrl());
        assertFalse(driver.findElements(By.cssSelector(".flash")).isEmpty(), "hláška nahoře");
        // podruhé už s čerstvým formulářem projde
        driver.findElement(By.name("username")).sendKeys(name);
        driver.findElement(By.name("password")).sendKeys(PASSWORD);
        submit(By.cssSelector("form[action$='login'] button[type=submit]"));
        assertFalse(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "přihlášený");
    }
}
