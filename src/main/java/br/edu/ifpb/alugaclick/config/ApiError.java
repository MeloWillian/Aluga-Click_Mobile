package br.edu.ifpb.alugaclick.config;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record ApiError(
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
) {
    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(
                LocalDateTime.now(),
                status,
                error,
                message,
                path
        );
    }
}
