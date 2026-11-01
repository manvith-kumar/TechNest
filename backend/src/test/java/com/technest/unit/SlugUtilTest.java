package com.technest.unit;

import static org.junit.jupiter.api.Assertions.*;

import com.technest.util.SlugUtil;
import java.util.Set;
import org.junit.jupiter.api.Test;

class SlugUtilTest {
    @Test
    void slugifiesNames() {
        assertEquals("apple-iphone-15-128gb", SlugUtil.slugify("Apple iPhone 15 (128GB)"));
        assertEquals("cafe-au-lait", SlugUtil.slugify("  Café  au   lait! "));
    }

    @Test
    void makesSlugsUnique() {
        Set<String> taken = Set.of("sony-xm5", "sony-xm5-2");
        assertEquals("sony-xm5-3", SlugUtil.unique("sony-xm5", taken::contains));
    }
}
