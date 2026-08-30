package com.uniservice.devops.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class DevOpsConfig {

    @Bean
    public Executor deploymentExecutor() {
        return new SimpleAsyncTaskExecutor("deploy-");
    }
}
