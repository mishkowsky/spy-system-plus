package com.itmo.spy_system.controller;

import com.itmo.spy_system.utils.EmailAlreadyExistsException;
import com.itmo.spy_system.utils.ResourceException;
import com.itmo.spy_system.utils.WrongOldPasswordException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

public class BaseExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleEmailAlreadyExistsException(EmailAlreadyExistsException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(WrongOldPasswordException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleWrongOldPasswordException(WrongOldPasswordException ex) {
        return ex.getMessage();
    }

    public record Error(String message) {
    }

    @ExceptionHandler(ResourceException.class)
    public ResponseEntity<Error> handleException(ResourceException e) {
        // log exception
        return ResponseEntity.status(e.getHttpStatus()).body(new Error(e.getMessage()));
    }
}
