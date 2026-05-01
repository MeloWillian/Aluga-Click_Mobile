package br.edu.ifpb.alugaclick.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            HttpMessageConversionException.class
    })
    public ResponseEntity<ApiError> handleMessageConversion(
            Exception ex,
            HttpServletRequest request
    ) {

        ApiError error = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Requisição inválida",
                "JSON inválido ou incompatível com o modelo esperado",
                request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Erro de validação");

        ApiError error = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Erro de validação",
                message,
                request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(error);
    }

    private String extractDatabaseMessage(Throwable ex) {
        Throwable root = ex;

        while (root.getCause() != null) {
            root = root.getCause();
        }

        String message = root.getMessage();

        if (message == null) {
            return "Violação de integridade de dados";
        }

        int detalheIndex = message.indexOf("Detalhe:");
        if (detalheIndex != -1) {
            return message.substring(detalheIndex).trim();
        }

        return message;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        String message = extractDatabaseMessage(ex);

        ApiError error = ApiError.of(
                HttpStatus.CONFLICT.value(),
                "Violação de integridade de dados",
                message,
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(
            Exception ex,
            HttpServletRequest request
    ) {
        ApiError error = ApiError.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Erro interno",
                "Ocorreu um erro inesperado. Tente novamente mais tarde.",
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
}
