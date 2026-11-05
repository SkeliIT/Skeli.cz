package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.JavascriptExecutor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Karaoke follows the player's real time (js/yt-clock.js): it starts within a second of the clip, stands
 * still on pause, jumps with a seek and keeps up with a faster speed. YouTube does not play in the test
 * browser, so a fake player in the iframe answers the same messages the YouTube player does.
 */
class KaraokeClockIT extends UiTestSupport {

    /** A player that only talks after "listening", reports every 0.5 s and obeys play/pause/seek/speed. */
    static final String FAKE = """
        var t = 60, playing = false, rate = 1, last = performance.now(), listening = false;
        function send(o) { parent.postMessage(JSON.stringify(o), '*'); }
        function tick() { var n = performance.now(); if (playing) t += (n - last) / 1000 * rate; last = n; }
        function state(s) { tick(); playing = s === 1; send({ event: 'onStateChange', info: s }); }
        addEventListener('message', function (e) {
          var m = JSON.parse(e.data);
          if (m.event === 'listening' && !listening) { listening = true; send({ event: 'onReady' }); setTimeout(function () { state(1); }, 300); }
          if (m.event === 'command') {
            tick();
            if (m.func === 'seekTo') t = m.args[0];
            if (m.func === 'pauseVideo') state(2);
            if (m.func === 'playVideo') state(1);
            if (m.func === 'setPlaybackRate') rate = m.args[0];
            send({ event: 'infoDelivery', info: { currentTime: t, playbackRate: rate } });
          }
        });
        setInterval(function () { tick(); if (listening) send({ event: 'infoDelivery', info: { currentTime: t, playerState: playing ? 1 : 2, playbackRate: rate } }); }, 500);
        """;

    JavascriptExecutor js() { return (JavascriptExecutor) driver; }

    /** The line karaoke shows as sung, and the line the timings say for the fake player's time. */
    long[] lines() {
        Object r = js().executeScript(
                "var now = document.querySelector('.k-line.k-now'); var t = window.__fakeT, times = window.__times, i = -1;"
                + "for (var k = 0; k < times.length; k++) { if (times[k][0] <= t) i = k; else break; }"
                + "return [now ? +now.dataset.i : -1, i];");
        java.util.List<?> l = (java.util.List<?>) r;
        return new long[]{((Number) l.get(0)).longValue(), ((Number) l.get(1)).longValue()};
    }

    void assertInStep(String when) {
        long[] l = lines();
        assertTrue(Math.abs(l[0] - l[1]) <= 1, when + ": karaoke shows line " + l[0] + ", the player is at line " + l[1]);
    }

    void command(String func, String args) {
        js().executeScript("document.querySelector('#ytFacade iframe').contentWindow.postMessage(JSON.stringify({ event: 'command', func: arguments[0], args: " + args + " }), '*')", func);
    }

    @Test
    void karaokeFollowsThePlayer() throws Exception {
        String uuid = queryString("SELECT s.uuid FROM songs s JOIN videos v ON v.song_id = s.id WHERE BINARY v.youtube_id = 'HCDDuRsWdRw'");
        assertNotNull(uuid, "the local DB needs Zoom – Drama with its clip");
        registerAndLogin("kc" + uniq());                     // karaoke je jen pro přihlášené
        driver.get(BASE_URL + "/index.jsp");
        js().executeScript("localStorage.setItem('cookieConsent','true'); localStorage.removeItem('karaoke'); localStorage.setItem('kevin','hidden');");
        driver.get(BASE_URL + "/cs/song/" + uuid);
        // the timings, and the fake player's own time as the test's reference
        js().executeAsyncScript("var done = arguments[0]; fetch('/api/karaoke?yt=HCDDuRsWdRw').then(r => r.json()).then(d => { window.__times = d.times; done(); });");
        js().executeScript("window.addEventListener('message', function (e) { try { var m = JSON.parse(e.data); if (m.info && typeof m.info.currentTime === 'number') window.__fakeT = m.info.currentTime; } catch (x) {} });"
                + "var f = document.createElement('iframe'); f.src = 'data:text/html,' + encodeURIComponent('<script>' + arguments[0] + '<\\/script>');"
                + "var b = document.getElementById('ytFacade'); b.innerHTML = ''; b.appendChild(f);", FAKE);

        // starts within a second of the player saying "playing" (the player starts 0.3 s after the hello)
        long t0 = System.currentTimeMillis();
        while (js().executeScript("return document.querySelector('.k-line.k-now')") == null && System.currentTimeMillis() - t0 < 4000) Thread.sleep(50);
        long started = System.currentTimeMillis() - t0;
        assertTrue(started < 1500, "karaoke started " + started + " ms after the clip was put in");
        Thread.sleep(1200);
        assertInStep("playing");

        // pause: the sung line stays where it is
        command("pauseVideo", "[]");
        Thread.sleep(700);
        long paused = lines()[0];
        Thread.sleep(2500);
        assertEquals(paused, lines()[0], "the line did not move during the pause");

        // seek back to the start of the song and play: the first lines again
        command("seekTo", "[32.5, true]");
        command("playVideo", "[]");
        Thread.sleep(1200);
        assertInStep("after seeking back");
        assertTrue(lines()[0] <= 2, "after seeking to 0:32 one of the first lines is sung, got " + lines()[0]);

        // twice as fast: still in step after a few seconds
        command("setPlaybackRate", "[2]");
        Thread.sleep(4000);
        assertInStep("at double speed");
    }
}
