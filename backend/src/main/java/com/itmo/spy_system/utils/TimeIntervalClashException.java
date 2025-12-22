package com.itmo.spy_system.utils;

import org.springframework.http.HttpStatus;

public class TimeIntervalClashException extends ResourceException {
    public TimeIntervalClashException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
