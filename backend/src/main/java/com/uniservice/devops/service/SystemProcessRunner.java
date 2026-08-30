package com.uniservice.devops.service;

import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class SystemProcessRunner implements ProcessRunner {

    private static final int MAX_OUTPUT_CHARS = 20_000;

    @Override
    public ProcessResult run(List<String> command, File workingDirectory, Duration timeout) {
        StringBuilder output = new StringBuilder();
        try {
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.directory(workingDirectory);
            builder.redirectErrorStream(true);
            Process process = builder.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (output.length() < MAX_OUTPUT_CHARS) {
                        output.append(line).append('\n');
                    }
                }
            }

            boolean finished = process.waitFor(timeout.toSeconds(), TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                output.append("\n[timed out after ").append(timeout.toMinutes()).append(" minutes]");
                return new ProcessResult(-1, truncate(output), true);
            }
            return new ProcessResult(process.exitValue(), truncate(output), false);
        } catch (Exception e) {
            output.append("\n[error] ").append(e.getMessage());
            return new ProcessResult(-1, truncate(output), false);
        }
    }

    private String truncate(StringBuilder output) {
        return output.length() > MAX_OUTPUT_CHARS ? output.substring(0, MAX_OUTPUT_CHARS) : output.toString();
    }
}
