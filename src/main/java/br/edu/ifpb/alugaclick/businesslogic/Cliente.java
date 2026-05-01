package br.edu.ifpb.alugaclick.businesslogic;

import br.edu.ifpb.alugaclick.entities.ClienteEntity;
import br.edu.ifpb.alugaclick.entities.ReservaEntity;
import br.edu.ifpb.alugaclick.entities.PagamentoEntity;
import br.edu.ifpb.alugaclick.services.ClienteService;
import br.edu.ifpb.alugaclick.services.VeiculoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/cliente")
public class Cliente {

    private final ClienteService clienteService;
    private final VeiculoService veiculoService;

    @Autowired
    public Cliente(ClienteService clienteService, VeiculoService veiculoService) {
        this.clienteService = clienteService;
        this.veiculoService = veiculoService;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<ClienteEntity> criarCadastro(@RequestBody ClienteEntity cliente) {
        ClienteEntity novoCliente = clienteService.criarCadastro(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoCliente);
    }

    @GetMapping("/{idCliente}")
    public ResponseEntity<ClienteEntity> visualizarDados(@PathVariable Long idCliente) {
        return clienteService.buscarPorId(idCliente)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{idCliente}")
    public ResponseEntity<ClienteEntity> alterarDados(@PathVariable Long idCliente, @RequestBody ClienteEntity cliente) {
        cliente.setId(idCliente);
        ClienteEntity clienteAtualizado = clienteService.alterarDados(cliente);
        return ResponseEntity.ok(clienteAtualizado);
    }

    @DeleteMapping("/{idCliente}")
    public ResponseEntity<Void> excluirCadastro(@PathVariable Long idCliente) {
        clienteService.excluirPorId(idCliente);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/pagamento/reserva/{reservaId}")
    public ResponseEntity<PagamentoEntity> efetuarPagamentoReserva(@PathVariable Long reservaId) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }


    @GetMapping("/{idCliente}/reservas/periodo")
    public ResponseEntity<List<ReservaEntity>> listarReservasPorPeriodo(
            @PathVariable Long idCliente,
            @RequestParam LocalDateTime dataInicial,
            @RequestParam LocalDateTime dataFim) {

        ClienteEntity cliente = clienteService.buscarPorId(idCliente).orElse(null);
        if (cliente == null) {
            return ResponseEntity.notFound().build();
        }

        List<ReservaEntity> reservas = clienteService.listarReservasPorPeriodo(cliente, dataInicial, dataFim);
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/{idCliente}/reservas/status/{status}")
    public ResponseEntity<List<ReservaEntity>> listarReservasPorStatus(
            @PathVariable Long idCliente,
            @PathVariable String status) {

        ClienteEntity cliente = clienteService.buscarPorId(idCliente).orElse(null);
        if (cliente == null) {
            return ResponseEntity.notFound().build();
        }

        List<ReservaEntity> reservas = clienteService.listarReservasPorStatus(cliente, status);
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/{idCliente}/reservas")
    public ResponseEntity<List<ReservaEntity>> listarTodasReservas(
            @PathVariable Long idCliente) {

        ClienteEntity cliente = clienteService.buscarPorId(idCliente).orElse(null);
        if (cliente == null) {
            return ResponseEntity.notFound().build();
        }

        List<ReservaEntity> reservas = clienteService.listarTodasSuasReservas(cliente);
        return ResponseEntity.ok(reservas);
    }


    @GetMapping("/{idCliente}/fidelidade")
    public ResponseEntity<String> consultarFidelidade(@PathVariable Long idCliente) {
        String nivel = clienteService.consultarNivelFidelidade(idCliente);
        return ResponseEntity.ok(nivel);
    }

    @GetMapping("/veiculos/disponiveis")
    public ResponseEntity<?> consultarVeiculosDisponiveis(
            @RequestParam LocalDateTime dataInicial,
            @RequestParam LocalDateTime dataFim,
            @RequestParam Long categoriaId) {

        List<?> veiculos = veiculoService.consultarDisponiveis(dataInicial, dataFim, categoriaId);
        return ResponseEntity.ok(veiculos);
    }
}