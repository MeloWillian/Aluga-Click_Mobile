package br.edu.ifpb.alugaclick.businesslogic;

import br.edu.ifpb.alugaclick.entities.*;
import br.edu.ifpb.alugaclick.services.*;
import br.edu.ifpb.alugaclick.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/funcionario")
public class Funcionario {

    private final ReservaService reservaService;
    private final LocacaoService locacaoService;
    private final FuncionarioService funcionarioService;
    private final VeiculoService veiculoService;
    private final ClienteService clienteService;

    @Autowired
    public Funcionario(ReservaService reservaService, LocacaoService locacaoService, FuncionarioService funcionarioService,
                       VeiculoService veiculoService, ClienteService clienteService) {
        this.reservaService = reservaService;
        this.locacaoService = locacaoService;
        this.funcionarioService = funcionarioService;
        this.veiculoService = veiculoService;
        this.clienteService = clienteService;
    }

    @GetMapping("/veiculos/modelo/{modelo}")
    public ResponseEntity<List<VeiculoEntity>> listarVeiculosPorModelo(@PathVariable String modelo) {
        return ResponseEntity.ok(veiculoService.listarVeiculosPorModelo(modelo));
    }

    @GetMapping("/veiculos/categoria/{categoriaNome}")
    public ResponseEntity<List<VeiculoEntity>> listarVeiculosPorCategoria(@PathVariable String categoriaNome) {
        return ResponseEntity.ok(veiculoService.listarVeiculosPorCategoria(categoriaNome));
    }

    @GetMapping("/veiculos/status/{status}")
    public ResponseEntity<List<VeiculoEntity>> listarVeiculosPorStatus(@PathVariable String status) {
        return ResponseEntity.ok(veiculoService.listarVeiculosPorStatus(status));
    }
    
    @PostMapping("/locacao/iniciar")
    public ResponseEntity<LocacaoEntity> criaNovaLocacao(
            @RequestParam Long idReserva,
            @RequestParam Long idFuncionario,
            @RequestParam String formaPagamento) {

        ReservaEntity reserva = reservaService.pesquisarReservaPorId(idReserva).orElseThrow(() -> new RuntimeException("Reserva não encontrada"));
        FuncionarioEntity funcionario = funcionarioService.buscarPorId(idFuncionario).orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        LocacaoEntity locacao = reservaService.confirmarReserva(reserva, funcionario, formaPagamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(locacao);
    }

    @PostMapping("/locacao/devolver/{idLocacao}")
    public ResponseEntity<ReciboEntity> registrarDevolucao(
            @PathVariable Long idLocacao,
            @RequestParam double kmFinal,
            @RequestParam String formaPagamentoAjuste,
            @RequestParam(required = false) LocalDateTime dataDevolucao) {

        LocalDateTime dataFinal = (dataDevolucao != null) ? dataDevolucao : LocalDateTime.now();

        LocacaoEntity locacao = locacaoService.buscarPorId(idLocacao)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada"));

        ReciboEntity recibo = locacaoService.registrarDevolucao(locacao, kmFinal, dataFinal, formaPagamentoAjuste);

        Long idCliente = locacao.getReserva().getCliente().getId();
        clienteService.avaliarNivelFidelidade(idCliente);

        return ResponseEntity.ok(recibo);
    }

    @GetMapping("/recibo/{idLocacao}")
    public ResponseEntity<ReciboEntity> emitirRecibo(@PathVariable Long idLocacao) {
        LocacaoEntity locacao = locacaoService.buscarPorId(idLocacao).orElseThrow(() -> new RuntimeException("Locação não encontrada")); 
        ReciboEntity recibo = locacao.getRecibo();
        return ResponseEntity.ok(recibo);
    }

    @PostMapping("/pagamento/registrar/{idLocacao}")
    public ResponseEntity<PagamentoEntity> registrarPagamento(@PathVariable Long idLocacao) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @PostMapping("/reservas/{idReserva}/confirmar")
    public ResponseEntity<LocacaoEntity> confirmarReserva(@PathVariable Long idReserva, @RequestParam Long idFuncionario, @RequestParam String formaPagamento) {
        ReservaEntity reserva = reservaService.pesquisarReservaPorId(idReserva).orElseThrow(() -> new RuntimeException("Reserva não encontrada"));
        FuncionarioEntity funcionario = funcionarioService.buscarPorId(idFuncionario).orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        LocacaoEntity locacao = reservaService.confirmarReserva(reserva, funcionario, formaPagamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(locacao);
    }

    @PostMapping("/reservas/{idReserva}/cancelar")
    public ResponseEntity<Void> cancelarReserva(@PathVariable Long idReserva) {
        ReservaEntity reserva = reservaService.pesquisarReservaPorId(idReserva).orElseThrow(() -> new RuntimeException("Reserva não encontrada"));
        reservaService.cancelarReserva(reserva);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reservas/{idReserva}/email")
    public ResponseEntity<Void> enviarConfirmacaoEmail(@PathVariable Long idReserva) {
        ReservaEntity reserva = reservaService.pesquisarReservaPorId(idReserva).orElseThrow(() -> new RuntimeException("Reserva não encontrada"));
        reservaService.enviarConfirmacaoEmail(reserva);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/reservas/{idReserva}")
    public ResponseEntity<ReservaEntity> pesquisaReservaPorId(@PathVariable Long idReserva) {
        return reservaService.pesquisarReservaPorId(idReserva)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/locacoes/{id}")
    public ResponseEntity<LocacaoEntity> buscarLocacaoPorId(@PathVariable Long id) {
        return locacaoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/locacoes/cliente/{idCliente}")
    public ResponseEntity<List<LocacaoEntity>> listarLocacoesPorCliente(@PathVariable Long idCliente) {
        return ResponseEntity.ok(locacaoService.listarLocacoesPorCliente(idCliente));
    }

    @GetMapping("/locacoes/veiculo/{idVeiculo}")
    public ResponseEntity<List<LocacaoEntity>> listarLocacoesPorVeiculo(@PathVariable Long idVeiculo) {
        return ResponseEntity.ok(locacaoService.listarLocacoesPorVeiculo(idVeiculo));
    }

    @GetMapping("/locacoes/periodo")
    public ResponseEntity<List<LocacaoEntity>> listarLocacoesPorPeriodo(
            @RequestParam LocalDateTime dataInicio,
            @RequestParam LocalDateTime dataFim) {
        return ResponseEntity.ok(locacaoService.listarLocacoesPorPeriodo(dataInicio, dataFim));
    }

    @GetMapping("/locacoes/status/{status}")
    public ResponseEntity<List<LocacaoEntity>> listarLocacaoPorStatus(@PathVariable String status) {
        return ResponseEntity.ok(locacaoService.listarLocacoesPorStatus(status));
    }

    @GetMapping("/reservas/cliente/{idCliente}")
    public ResponseEntity<List<ReservaEntity>> listarReservasPorCliente(@PathVariable Long idCliente) {
        List<ReservaEntity> reservas = clienteService.listarReservasPorCliente(idCliente);
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/reservas/periodo")
    public ResponseEntity<List<ReservaEntity>> listarReservasPorPeriodo(
            @RequestParam LocalDateTime dataInicio,
            @RequestParam LocalDateTime dataFim) {
        return ResponseEntity.ok(clienteService.listarTodasReservasPorPeriodo(dataInicio, dataFim));
    }

    @GetMapping("/reservas/status/{status}")
    public ResponseEntity<List<ReservaEntity>> listarReservasPorStatus(@PathVariable String status) {
        return ResponseEntity.ok(clienteService.listarTodasReservasPorStatus(status));
    }

    @GetMapping("/clientes/nome/{nome}")
    public ResponseEntity<ClienteEntity> pesquisarClientePorNome(@PathVariable String nome) {
        return clienteService.pesquisarClientePorNome(nome)
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/clientes/cpf/{cpf}")
    public ResponseEntity<ClienteEntity> pesquisarClientePorCpf(@PathVariable String cpf) {
        return clienteService.pesquisarClientePorCpf(cpf) 
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/clientes")
    public ResponseEntity<List<ClienteEntity>> listarClientes() {
        return ResponseEntity.ok(clienteService.listarTodosClientes()); 
    }
    
    @PostMapping("/clientes/incluir")
    public ResponseEntity<ClienteEntity> incluirNovoCliente(@RequestBody ClienteEntity cliente) {
        ClienteEntity novoCliente = clienteService.criarCadastro(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoCliente);
    }

    @GetMapping("/clientes/{idCliente}/fidelidade")
    public ResponseEntity<String> consultaFidelidade(@PathVariable Long idCliente) {
        String nivel = clienteService.consultarNivelFidelidade(idCliente);
        return ResponseEntity.ok(nivel);
    }

    @GetMapping("/locacoes")
    public ResponseEntity<List<LocacaoEntity>> listarTodasLocacoes() {
        return ResponseEntity.ok(locacaoService.listarTodas());
    }

    @GetMapping("/reservas")
    public ResponseEntity<List<ReservaEntity>> listarTodasReservas() {
        return ResponseEntity.ok(reservaService.listarTodas());
    }
}