package com.github.skeliit;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

/**
 * Simple Spring Boot REST controller sample for Continue.dev testing.
 */
@RestController
@RequestMapping("/api/sample")
public class SpringBootControllerSample {

    @GetMapping("/hello")
    public Map<String, String> hello() {
        return Map.of(
            "message", "Hello from Continue.dev test controller!",
            "status", "ok"
        );
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "service", "SpringBootControllerSample",
            "uptime", System.currentTimeMillis(),
            "ready", true
        );
    }
}
