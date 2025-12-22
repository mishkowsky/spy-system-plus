package com.itmo.spy_system.utils;

import org.springframework.http.HttpStatus;

public class WrongOldPasswordException extends ResourceException {

    // Constructor that accepts a message
    public WrongOldPasswordException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
