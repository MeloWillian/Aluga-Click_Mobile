package br.edu.ifpb.alugaclick.businesslogic;

import br.edu.ifpb.alugaclick.entities.*;
import br.edu.ifpb.alugaclick.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/usuario")
public class Usuario {

    private final UsuarioService usuarioService;
    private final ReservaService reservaService;
    private final ClienteService clienteService;

    @Autowired
    public Usuario(UsuarioService usuarioService, ReservaService reservaService, ClienteService clienteService) {
        this.usuarioService = usuarioService;
        this.reservaService = reservaService;
        this.clienteService = clienteService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> logar(@RequestParam String login, @RequestParam String senha) {

        boolean autenticado = usuarioService.logar(login, senha);

        if (autenticado) {
            Optional<UsuarioEntity> usuarioOpt = usuarioService.buscarPorLogin(login);

            if (usuarioOpt.isPresent()) {
                return ResponseEntity.ok(usuarioOpt.get());
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login ou senha inválidos.");
    }

    @PostMapping("/reserva")
    public ResponseEntity<ReservaEntity> criarReserva(@RequestBody ReservaEntity reserva) {
        boolean sucesso = reservaService.criarReserva(reserva);

        if (sucesso) {
            return ResponseEntity.status(HttpStatus.CREATED).body(reserva);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/reserva/{idReserva}/cancelar")
    public ResponseEntity<Void> cancelarReserva(@PathVariable Long idReserva) {
        ReservaEntity reserva = reservaService.pesquisarReservaPorId(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        boolean cancelada = reservaService.cancelarReserva(reserva);

        if (cancelada) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}