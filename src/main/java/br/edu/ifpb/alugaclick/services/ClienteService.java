package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.ClienteEntity;
import br.edu.ifpb.alugaclick.entities.LocacaoEntity;
import br.edu.ifpb.alugaclick.entities.ReservaEntity;
import br.edu.ifpb.alugaclick.repositories.ClienteRepository;
import br.edu.ifpb.alugaclick.repositories.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final ReservaRepository reservaRepository;
    private final LocacaoService locacaoService;
    private final UsuarioService usuarioService;

    @Autowired
    public ClienteService(ClienteRepository clienteRepository, ReservaRepository reservaRepository, LocacaoService locacaoService, UsuarioService usuarioService) {
        this.clienteRepository = clienteRepository;
        this.reservaRepository = reservaRepository;
        this.locacaoService = locacaoService;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public ClienteEntity criarCadastro(ClienteEntity cliente) {
        return (ClienteEntity) usuarioService.salvarUsuario(cliente);
    }

    @Transactional(readOnly = true)
    public List<ReservaEntity> listarReservasPorPeriodo(ClienteEntity cliente, LocalDateTime dataInicio, LocalDateTime dataFim) {
        return reservaRepository.findByClienteAndDataInicioBetween(cliente, dataInicio, dataFim);
    }

    @Transactional(readOnly = true)
    public List<ReservaEntity> listarReservasPorCliente(Long clienteId) {
        return reservaRepository.findByClienteId(clienteId);
    }

    @Transactional(readOnly = true)
    public List<ReservaEntity> listarReservasPorStatus(ClienteEntity cliente, String status) {
        return reservaRepository.findByClienteAndStatus(cliente, status);
    }

    @Transactional(readOnly = true)
    public List<ReservaEntity> listarTodasReservasPorPeriodo(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return reservaRepository.findByDataInicioBetween(dataInicio, dataFim);
    }

    @Transactional(readOnly = true)
    public List<ReservaEntity> listarTodasReservasPorStatus(String status) {
        return reservaRepository.findByStatus( status);
    }

    @Transactional(readOnly = true)
    public List<ReservaEntity> listarTodasSuasReservas(ClienteEntity cliente) {
        return reservaRepository.findByCliente(cliente);
    }

    @Transactional(readOnly = true)
    public String consultarNivelFidelidade(Long idCliente) {
        Optional<ClienteEntity> clienteOpt = clienteRepository.findById(idCliente);
        return clienteOpt.map(ClienteEntity::getNivelFidelidade).orElse("Cliente não encontrado");
    }

    @Transactional
    public ClienteEntity alterarDados(ClienteEntity dadosNovos) {
        ClienteEntity clienteExistente = clienteRepository.findById(dadosNovos.getId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        if (dadosNovos.getNome() != null) {
            clienteExistente.setNome(dadosNovos.getNome());
        }
        if (dadosNovos.getTelefone() != null) {
            clienteExistente.setTelefone(dadosNovos.getTelefone());
        }
        if (dadosNovos.getEndereco() != null) {
            clienteExistente.setEndereco(dadosNovos.getEndereco());
        }
        if (dadosNovos.getEmail() != null) {
            clienteExistente.setEmail(dadosNovos.getEmail());
        }
        if (dadosNovos.getSenhaHash() != null && !dadosNovos.getSenhaHash().isEmpty()) {
            clienteExistente.setSenhaHash(dadosNovos.getSenhaHash());
        }

        return (ClienteEntity) usuarioService.salvarUsuario(clienteExistente);
    }


    @Transactional(readOnly = true)
    public Optional<ClienteEntity> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    @Transactional
    public void excluirPorId(Long id) {
        usuarioService.excluirPorId(id);
    }

    @Transactional(readOnly = true)
    public Optional<ClienteEntity> pesquisarClientePorNome(String nome) {
         return clienteRepository.findByLogin(nome);
    }

    @Transactional(readOnly = true)
    public Optional<ClienteEntity> pesquisarClientePorCpf(String cpf) {
        return clienteRepository.findByCpf(cpf);
    }

    @Transactional(readOnly = true)
    public List<ClienteEntity> listarTodosClientes() {
        return clienteRepository.findAll();
    }

    @Transactional
    public String avaliarNivelFidelidade(Long idCliente) {
        ClienteEntity cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado."));

        List<LocacaoEntity> locacoesFinalizadas = locacaoService.listarLocacoesPorCliente(idCliente).stream()
                .filter(l -> "FINALIZADA".equalsIgnoreCase(l.getStatus()))
                .toList();

        int totalLocacoes = locacoesFinalizadas.size();
        String novoNivel;

        if (totalLocacoes >= 10) {
            novoNivel = "Ouro";
        } else if (totalLocacoes >= 5) {
            novoNivel = "Prata";
        } else {
            novoNivel = "Bronze";
        }

        if (!novoNivel.equals(cliente.getNivelFidelidade())) {
            cliente.setNivelFidelidade(novoNivel);
            clienteRepository.save(cliente);
        }

        return novoNivel;
    }
}