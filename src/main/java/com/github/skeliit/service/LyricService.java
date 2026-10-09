package com.github.skeliit.service;

import com.github.skeliit.dao.LyricDao;
import com.github.skeliit.dao.SongDao;
import com.github.skeliit.model.CommentView;
import com.github.skeliit.model.LyricView;
import com.github.skeliit.model.Song;
import java.sql.SQLException;
import java.util.List;

public class LyricService {
    private final SongDao songs = new SongDao();
    private final LyricDao lyrics = new LyricDao();

    public List<Song> listSongs() throws SQLException { return songs.listWithFirstLyric(); }
    public LyricView getLyric(int id, String lang) throws SQLException { return lyrics.getLyricView(id, lang); }
    public Integer findLyricIdBySongUuid(String uuid, String lang) throws SQLException {
        return lyrics.findLyricIdBySongUuid(uuid, lang);
    }
    public List<CommentView> comments(int lyricId) throws SQLException { return lyrics.listComments(lyricId); }
}
