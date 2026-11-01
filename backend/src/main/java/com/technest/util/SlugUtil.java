package com.technest.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class SlugUtil {
    private SlugUtil() {}

    public static String slugify(String input) {
        if (input == null) return "";
        String s = Normalizer.normalize(input, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        s = s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        return s.length() > 180 ? s.substring(0, 180).replaceAll("-+$", "") : s;
    }

    /** Appends -2, -3, ... until the slug is unused. */
    public static String unique(String base, Predicate<String> exists) {
        String slug = base.isEmpty() ? "item" : base;
        String candidate = slug;
        int n = 2;
        while (exists.test(candidate)) {
            candidate = slug + "-" + n++;
        }
        return candidate;
    }
}
