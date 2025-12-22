package com.itmo.spy_system.entity;

public enum Weekday {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY;

    public static int getWeekdayDifference(Weekday start, Weekday end) {
        int startIndex = start.ordinal();
        int endIndex = end.ordinal();
        int diff = endIndex - startIndex;
        return diff >= 0 ? diff : 7 + diff;
    }
}
