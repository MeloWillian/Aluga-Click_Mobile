package br.edu.ifpb.alugaclick.businesslogic;

import br.edu.ifpb.alugaclick.entities.*;
import br.edu.ifpb.alugaclick.repositories.PagamentoRepository;
import br.edu.ifpb.alugaclick.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gerente")
public class Gerente {

    private final GerenteService gerenteService;
    private final PerfilService perfilService;
    private final ClienteService clienteService;
    private final UsuarioService usuarioService;
    private final VeiculoService veiculoService;
    private final PagamentoService pagamentoService;
    private final MultaService multaService;
    private final ReciboService reciboService;

    @Autowired
    private CategoriaService categoriaService;

    @Autowired
    public Gerente(GerenteService gerenteService, PerfilService perfilService, ClienteService clienteService, UsuarioService usuarioService, VeiculoService veiculoService, PagamentoService pagamentoService, MultaService multaService, ReciboService reciboService) {
        this.gerenteService = gerenteService;
        this.perfilService = perfilService;
        this.clienteService = clienteService;
        this.usuarioService = usuarioService;
        this.veiculoService = veiculoService;
        this.pagamentoService = pagamentoService;
        this.multaService = multaService;
        this.reciboService = reciboService;
    }

    @PostMapping("/perfil")
    public ResponseEntity<PerfilEntity> criarPerfil(@RequestBody PerfilEntity perfil) {
        PerfilEntity novoPerfil = gerenteService.criarPerfil(perfil);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoPerfil);
    }

    @PutMapping("/perfil/{id}")
    public ResponseEntity<PerfilEntity> editarPerfil(@PathVariable Long id, @RequestBody PerfilEntity perfil) {
        perfil.setId(id);
        PerfilEntity perfilAtualizado = gerenteService.criarPerfil(perfil);
        return ResponseEntity.ok(perfilAtualizado);
    }

    @DeleteMapping("/perfil/{id}")
    public ResponseEntity<Void> excluirPerfil(@PathVariable Long id) {
        perfilService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/perfis")
    public ResponseEntity<List<PerfilEntity>> listaPerfis() {
        return ResponseEntity.ok(gerenteService.listaPerfis());
    }

    @PutMapping("/perfil/permissoes")
    public ResponseEntity<PerfilEntity> gestaoPermissoesPerfil(@RequestBody PerfilEntity perfil) {
        PerfilEntity perfilAtualizado = perfilService.atualizarPermissoes(perfil);
        return ResponseEntity.ok(perfilAtualizado);
    }

    @GetMapping("/veiculo/{id}")
    public ResponseEntity<VeiculoEntity> buscarVeiculoPorId(@PathVariable Long id) {
        return veiculoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/veiculo")
    public ResponseEntity<VeiculoEntity> incluirNovoVeiculo(@RequestBody VeiculoEntity veiculo) {
        VeiculoEntity novoVeiculo = gerenteService.incluirNovoVeiculo(veiculo);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoVeiculo);
    }

    @PutMapping("/veiculo/{id}")
    public ResponseEntity<VeiculoEntity> alterarVeiculo(@PathVariable Long id, @RequestBody VeiculoEntity veiculo) {
        veiculo.setId(id);
        VeiculoEntity veiculoAtualizado = gerenteService.incluirNovoVeiculo(veiculo);
        return ResponseEntity.ok(veiculoAtualizado);
    }

    @PutMapping("/veiculo/{id}/retirar")
    public ResponseEntity<Void> retirarVeiculoDaFrota(@PathVariable Long id) {
        boolean sucesso = gerenteService.retirarVeiculoDaFrota(id);
        if (sucesso) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/veiculo/{id}/status")
    public ResponseEntity<Void> gestaoManutencao(@PathVariable Long id, @RequestParam String status) {
        boolean sucesso = veiculoService.alterarStatusVeiculo(id, status.toUpperCase());
        if (sucesso) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/frota")
    public ResponseEntity<List<VeiculoEntity>> gestaoFrota() {
        List<VeiculoEntity> frota = veiculoService.listarTodosVeiculos();
        return ResponseEntity.ok(frota);
    }

    @PostMapping("/usuario")
    public ResponseEntity<UsuarioEntity> criarUsuario(@RequestBody UsuarioEntity usuario) {
        UsuarioEntity novoUsuario = gerenteService.criarUsuario(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoUsuario);
    }

    @PatchMapping("/usuario/{id}")
    public ResponseEntity<UsuarioEntity> editarUsuario(@PathVariable Long id, @RequestBody UsuarioEntity usuarioParcial) {
        try {
            UsuarioEntity usuarioAtualizado = gerenteService.atualizarParcial(id, usuarioParcial);
            return ResponseEntity.ok(usuarioAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/usuario/{id}")
    public ResponseEntity<Void> deletarUsuario(@PathVariable Long id) {
        usuarioService.excluirPorId(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioEntity>> listarUsuarios() {
        List<UsuarioEntity> todosUsuarios = usuarioService.listarTodosUsuarios();
        return ResponseEntity.ok(todosUsuarios);
    }

    @GetMapping("/usuario/{id}")
    public ResponseEntity<UsuarioEntity> buscarUsuarioPorId(@PathVariable Long id) {
        return usuarioService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/fidelidade/{idCliente}/avaliar")
    public ResponseEntity<String> configurarProgramaFidelidade(@PathVariable Long idCliente) {
        String novoNivel = clienteService.avaliarNivelFidelidade(idCliente);
        return ResponseEntity.ok("Nível de fidelidade atualizado para: " + novoNivel);
    }

    @PostMapping("/categoria")
    public ResponseEntity<CategoriaEntity> criarCategoria(@RequestBody CategoriaEntity categoria) {
        CategoriaEntity novaCategoria = categoriaService.salvar(categoria);
        return ResponseEntity.status(HttpStatus.CREATED).body(novaCategoria);
    }

    @DeleteMapping("/categoria/{id}")
    public ResponseEntity<Void> excluirCategoria(@PathVariable Long id) {
        categoriaService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categoria/{id}")
    public ResponseEntity<CategoriaEntity> buscarCategoriaPorId(@PathVariable Long id) {
        return categoriaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaEntity>> listarCategorias() {
        return ResponseEntity.ok(categoriaService.listarTodas());
    }

    @PutMapping("/categoria/{id}")
    public ResponseEntity<CategoriaEntity> editarCategoria(@PathVariable Long id, @RequestBody CategoriaEntity categoria) {
        try {
            CategoriaEntity categoriaAtualizada = categoriaService.atualizar(id, categoria);
            return ResponseEntity.ok(categoriaAtualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/perfil/{id}")
    public ResponseEntity<PerfilEntity> buscarPerfilPorId(@PathVariable Long id) {
        return perfilService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pagamentos")
    public ResponseEntity<List<PagamentoEntity>> listarPagamentos() {
        return ResponseEntity.ok(pagamentoService.listarTodos());
    }

    @GetMapping("/multas")
    public ResponseEntity<List<MultaEntity>> listarMultas() {
        return ResponseEntity.ok(multaService.listarTodas());
    }

    @GetMapping("/multa/{id}")
    public ResponseEntity<MultaEntity> buscarMultaPorId(@PathVariable Long id) {
        return multaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pagamento/{id}")
    public ResponseEntity<PagamentoEntity> buscarPagamentoPorId(@PathVariable Long id) {
        return pagamentoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/recibos")
    public ResponseEntity<List<ReciboEntity>> listarRecibos() {
        return ResponseEntity.ok(reciboService.listarTodos());
    }

    @GetMapping("/recibo/{id}")
    public ResponseEntity<ReciboEntity> buscarReciboPorId(@PathVariable Long id) {
        return reciboService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}