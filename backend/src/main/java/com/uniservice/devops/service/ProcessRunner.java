package com.uniservice.devops.service;

import java.io.File;
import java.time.Duration;
import java.util.List;

public interface ProcessRunner {
    ProcessResult run(List<String> command, File workingDirectory, Duration timeout);
}
