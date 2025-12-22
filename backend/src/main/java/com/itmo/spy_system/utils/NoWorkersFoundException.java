package com.itmo.spy_system.utils;

import org.springframework.http.HttpStatus;

public class NoWorkersFoundException extends ResourceException {

    // Constructor that accepts a message
    public NoWorkersFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
