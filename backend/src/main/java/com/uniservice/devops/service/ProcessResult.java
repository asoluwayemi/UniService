package com.uniservice.devops.service;

public record ProcessResult(int exitCode, String output, boolean timedOut) {
    public boolean success() {
        return !timedOut && exitCode == 0;
    }
}
