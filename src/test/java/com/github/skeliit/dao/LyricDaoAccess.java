package com.github.skeliit.dao;

import java.util.List;

import com.github.skeliit.model.CommentView;

/** Exposes the package-private threading helper to tests in other packages. */
public final class LyricDaoAccess {
    private LyricDaoAccess() {}

    public static List<CommentView> threads(List<CommentView> newestFirst) {
        return LyricDao.threads(newestFirst);
    }
}
