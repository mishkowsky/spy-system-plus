package com.itmo.spy_system.utils;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends ResourceException {


    // Constructor that accepts a message
    public EmailAlreadyExistsException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}