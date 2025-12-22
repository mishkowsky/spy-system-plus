package com.itmo.spy_system.utils;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.stream.Stream;
import java.beans.FeatureDescriptor;

@Component
public class NullAwareBeanUtilsBean {

    public static void copyNonNullProperties(Object source, Object target) {
        BeanUtils.copyProperties(source, target, getNullPropertyNames(source));
    }

    private static String[] getNullPropertyNames(Object source) {
        final BeanWrapper wrappedSource = new BeanWrapperImpl(source);
        return Stream.of(wrappedSource.getPropertyDescriptors())
                .map(FeatureDescriptor::getName)
                .filter(propertyName -> wrappedSource.getPropertyValue(propertyName) == null)
                .toArray(String[]::new);
    }

    public static void copyProperties(Object fromDb, Object toBePatched, Map<String, Object> fieldsToPatch) {
        String[] fieldNames = new String[fromDb.getClass().getDeclaredFields().length] ;
        int i = 0;
        for (Field f : fromDb.getClass().getDeclaredFields()) {
            if (!fieldsToPatch.containsKey(f.getName())) {
                fieldNames[i++] = f.getName();
            }
        }
        BeanUtils.copyProperties(toBePatched, fromDb, fieldNames);
    }
}